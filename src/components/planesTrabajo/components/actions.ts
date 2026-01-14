"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { PlanTrabajo, PlanTrabajoProgramacion } from "@/generated/client";
import type { PlanTrabajoEstado, ProgramacionPrecision } from "@/generated/enums";
import {
  addMonths,
  parseDateOnlyToLocalNoon,
  parseMonthOnlyToLocalNoon,
  toDateOnlyString,
  toMonthOnlyString,
} from "@/lib/dates";
import { uploadFileToR2 } from "@/lib/r2-upload";

export type PlanTrabajoWithProgramaciones = PlanTrabajo & {
  cliente: { id: string; name: string };
  propuesta: { id: string; codigo: string; items: string[]; servicioId: string };
  propuestaItemsDetalle: {
    id: string;
    name: string;
    tipoDeInformeId: string | null;
    esPlanificable: boolean;
    hasVariant: boolean;
    variantTypeId: string | null;
    variantType: { id: string; name: string } | null;
  }[];
  programaciones: (PlanTrabajoProgramacion & {
    item: {
      id: string;
      name: string;
      tipoDeInformeId: string | null;
      esPlanificable: boolean;
      hasVariant: boolean;
      variantTypeId: string | null;
      variantType: { id: string; name: string } | null;
    };
    detalleVariante: { id: string; name: string; variantTypeId: string; variantType: { id: string; name: string } } | null;
    clientLocation: { id: string; name: string } | null;
    informe: { id: string; estado: string; adjunto: string | null } | null;
  })[];
  detallesVariante: { id: string; name: string; variantTypeId: string; variantType: { id: string; name: string } }[];
};

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

async function resolveDetalleVarianteId(params: {
  item: { hasVariant: boolean; variantTypeId: string | null };
  detalleVarianteId?: string;
}): Promise<string | null> {
  const { item, detalleVarianteId } = params;

  if (!item.hasVariant) {
    if (detalleVarianteId) {
      throw new Error("Este item no requiere un detalle de variante");
    }
    return null;
  }

  if (!item.variantTypeId) {
    throw new Error("El item posee variantes pero no tiene un tipo de variante configurado");
  }

  if (!detalleVarianteId) {
    throw new Error("Seleccioná el detalle de variante para este item");
  }

  const detalle = await prisma.detalleVariante.findUnique({
    where: { id: detalleVarianteId },
    select: { id: true, variantTypeId: true, is_active: true },
  });

  if (!detalle || !detalle.is_active) {
    throw new Error("El detalle de variante seleccionado no está disponible");
  }

  if (detalle.variantTypeId !== item.variantTypeId) {
    throw new Error("El detalle de variante no corresponde al tipo del item");
  }

  return detalle.id;
}

function normalizeProgramacionDate(
  raw: string,
  precision: ProgramacionPrecision,
): Date {
  if (precision === "mes") {
    const monthValue = raw.length >= 7 ? raw.slice(0, 7) : raw;
    return parseMonthOnlyToLocalNoon(monthValue);
  }

  return parseDateOnlyToLocalNoon(raw);
}

function assertDateInRange(value: Date, inicio: Date, fin: Date) {
  if (value.getTime() < inicio.getTime()) {
    throw new Error("La fecha programada no puede ser anterior a la fecha de inicio del plan");
  }
  if (value.getTime() > fin.getTime()) {
    throw new Error("La fecha programada no puede ser posterior a la fecha de fin del plan");
  }
}

function computePlanTrabajoEstado(params: {
  fechaFin: Date;
  propuestaItems: string[];
  programaciones: Array<{ itemId: string; ejecutadoAt: Date | null; informeEntregado: boolean }>;
}): PlanTrabajoEstado {
  const today = new Date();
  const fechaFinSuperada = today.getTime() > params.fechaFin.getTime();

  const totalItems = new Set(params.propuestaItems).size;
  const programadosPorItem = new Set(params.programaciones.map((p) => p.itemId)).size;

  const hayAlgunaProgramacion = params.programaciones.length > 0;
  const todosItemsTienenProgramacion = totalItems > 0 && programadosPorItem >= totalItems;

  const hayAlgunaEjecucion = params.programaciones.some(
    (p) => Boolean(p.ejecutadoAt) || p.informeEntregado,
  );

  const hayPendientesSinEjecutar = params.programaciones.some(
    (p) => !p.ejecutadoAt && !p.informeEntregado,
  );

  if (fechaFinSuperada) {
    return hayPendientesSinEjecutar ? "finalizado_con_pendientes" : "finalizado_completo";
  }

  if (!hayAlgunaProgramacion) return "pendiente_programacion";

  if (!todosItemsTienenProgramacion) return "programado_incompleto";

  if (todosItemsTienenProgramacion && !hayAlgunaEjecucion) return "programado_completo";

  return "en_desarrollo";
}

export async function refreshPlanTrabajoEstado(planTrabajoId: string) {
  const plan = await prisma.planTrabajo.findUnique({
    where: { id: planTrabajoId },
    include: {
      propuesta: { select: { items: true } },
      programaciones: {
        select: {
          itemId: true,
          ejecutadoAt: true,
          informe: { select: { estado: true, adjunto: true } },
        },
      },
    },
  });

  if (!plan) return;

  const estado = computePlanTrabajoEstado({
    fechaFin: plan.fechaFin,
    propuestaItems: plan.propuesta.items,
    programaciones: plan.programaciones.map((p: { itemId: string; ejecutadoAt: Date | null; informe?: { estado: string; adjunto: string | null } | null }) => ({
      itemId: p.itemId,
      ejecutadoAt: p.ejecutadoAt,
      informeEntregado: p.informe?.estado === "entregado" && Boolean(p.informe?.adjunto),
    })),
  });

  if (plan.estado !== estado) {
    await prisma.planTrabajo.update({
      where: { id: planTrabajoId },
      data: { estado },
    });
  }
}

export async function createPlanTrabajoFromPropuesta(params: {
  propuestaId: string;
  fechaInicio: string;
  fechaFin: string;
}) {
  const fechaInicio = parseDateOnlyToLocalNoon(params.fechaInicio);
  const fechaFin = parseDateOnlyToLocalNoon(params.fechaFin);

  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
    throw new Error("Fecha de inicio/fin inválida");
  }

  if (fechaInicio.getTime() > fechaFin.getTime()) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
  }

  const propuesta = await prisma.propuestaTecnica.findUnique({
    where: { id: params.propuestaId },
    include: {
      servicios: true,
    },
  });

  if (!propuesta) throw new Error("Propuesta no encontrada");

  if (propuesta.servicios.type !== "mensual") {
    return { success: false, reason: "Servicio no es mensual" };
  }

  const planExistente = await prisma.planTrabajo.findFirst({
    where: { propuestaId: propuesta.id },
    orderBy: { createdAt: "desc" },
  });

  if (planExistente) {
    return { success: false, reason: "La propuesta ya tiene un plan de trabajo" };
  }

  const plan = await prisma.planTrabajo.create({
    data: {
      clienteId: propuesta.clienteId,
      propuestaId: propuesta.id,
      fechaInicio,
      fechaFin,
      estado: "pendiente_programacion",
    },
  });

  revalidatePath("/dashboard");
  return { success: true, planId: plan.id };
}

export async function getPlanesTrabajo() {
  const planes = await prisma.planTrabajo.findMany({
    include: {
      cliente: { select: { id: true, name: true } },
      propuesta: { select: { id: true, codigo: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!planes) return [];

  return planes;
}

export type PlanTrabajoListItem = Awaited<ReturnType<typeof getPlanesTrabajo>>[0];

export type PlanTrabajoProgramacionCalendarItem = {
  id: string;
  planTrabajoId: string;
  planTrabajoEstado: PlanTrabajoEstado;
  clienteId: string;
  clienteNombre: string;
  propuestaCodigo: string;
  itemId: string;
  itemNombre: string;
  requiereInforme: boolean;
  detalleVarianteNombre: string | null;
  clientLocationNombre: string | null;
  fechaProgramada: string;
  precision: ProgramacionPrecision;
  ejecutado: boolean;
};

export async function getPlanTrabajoProgramacionesByRange(params: {
  from: string;
  to: string;
}): Promise<PlanTrabajoProgramacionCalendarItem[]> {
  const from = new Date(params.from);
  const to = new Date(params.to);

  if (!isValidDate(from) || !isValidDate(to)) {
    throw new Error("Rango de fechas inválido");
  }

  const programaciones = await prisma.planTrabajoProgramacion.findMany({
    where: {
      fechaProgramada: {
        gte: from,
        lte: to,
      },
    },
    include: {
      planTrabajo: {
        select: {
          id: true,
          estado: true,
          cliente: { select: { id: true, name: true } },
          propuesta: { select: { codigo: true } },
        },
      },
      item: { select: { id: true, name: true, tipoDeInformeId: true } },
      clientLocation: { select: { name: true } },
      detalleVariante: { select: { name: true } },
      informe: { select: { estado: true, adjunto: true } },
    },
    orderBy: { fechaProgramada: "asc" },
  });

  return programaciones.map((p) => {
    const ejecutado = Boolean(p.ejecutadoAt) || (p.informe?.estado === "entregado" && Boolean(p.informe?.adjunto));
    const requiereInforme = Boolean(p.item.tipoDeInformeId);
    const itemNombreBase = p.item.name;

    const fechaProgramada =
      p.precision === "mes" ? toMonthOnlyString(p.fechaProgramada) : toDateOnlyString(p.fechaProgramada);

    return {
      id: p.id,
      planTrabajoId: p.planTrabajoId,
      planTrabajoEstado: p.planTrabajo.estado as PlanTrabajoEstado,
      clienteId: p.planTrabajo.cliente.id,
      clienteNombre: p.planTrabajo.cliente.name,
      propuestaCodigo: p.planTrabajo.propuesta.codigo,
      itemId: p.itemId,
      itemNombre: itemNombreBase,
      requiereInforme,
      detalleVarianteNombre: p.detalleVariante?.name ?? null,
      clientLocationNombre: p.clientLocation?.name ?? null,
      fechaProgramada,
      precision: p.precision as ProgramacionPrecision,
      ejecutado,
    };
  });
}

export async function getPlanTrabajo(planTrabajoId: string): Promise<PlanTrabajoWithProgramaciones | null> {
  const plan = await prisma.planTrabajo.findUnique({
    where: { id: planTrabajoId },
    include: {
      cliente: { select: { id: true, name: true } },
      propuesta: { select: { id: true, codigo: true, items: true, servicioId: true } },
      programaciones: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              tipoDeInformeId: true,
              esPlanificable: true,
              hasVariant: true,
              variantTypeId: true,
              variantType: { select: { id: true, name: true } },
            },
          },
          detalleVariante: {
            select: {
              id: true,
              name: true,
              variantTypeId: true,
              variantType: { select: { id: true, name: true } },
            },
          },
          clientLocation: { select: { id: true, name: true } },
          informe: { select: { id: true, estado: true, adjunto: true } },
        },
        orderBy: { fechaProgramada: "asc" },
      },
    },
  });

  if (!plan) return null;

  const propuestaItemsDetalle = plan.propuesta.items.length
    ? await prisma.items.findMany({
        where: { id: { in: plan.propuesta.items } },
        select: {
          id: true,
          name: true,
          tipoDeInformeId: true,
          esPlanificable: true,
          hasVariant: true,
          variantTypeId: true,
          variantType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const variantTypeIds = Array.from(
    new Set(
      propuestaItemsDetalle
        .filter((item) => item.hasVariant && item.variantTypeId)
        .map((item) => item.variantTypeId as string),
    ),
  );

  const detallesVariante = variantTypeIds.length
    ? await prisma.detalleVariante.findMany({
        where: {
          is_active: true,
          variantTypeId: { in: variantTypeIds },
        },
        select: {
          id: true,
          name: true,
          variantTypeId: true,
          variantType: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  await refreshPlanTrabajoEstado(plan.id);

  return {
    ...(plan as unknown as Omit<PlanTrabajoWithProgramaciones, "propuestaItemsDetalle" | "detallesVariante">),
    propuestaItemsDetalle,
    detallesVariante,
  };
}

export async function getPlanTrabajoByPropuesta(propuestaId: string): Promise<PlanTrabajoWithProgramaciones | null> {
  const plan = await prisma.planTrabajo.findFirst({
    where: { propuestaId },
    orderBy: { createdAt: "desc" },
    include: {
      cliente: { select: { id: true, name: true } },
      propuesta: { select: { id: true, codigo: true, items: true, servicioId: true } },
      programaciones: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              tipoDeInformeId: true,
              esPlanificable: true,
              hasVariant: true,
              variantTypeId: true,
              variantType: { select: { id: true, name: true } },
            },
          },
          detalleVariante: {
            select: {
              id: true,
              name: true,
              variantTypeId: true,
              variantType: { select: { id: true, name: true } },
            },
          },
          clientLocation: { select: { id: true, name: true } },
          informe: { select: { id: true, estado: true, adjunto: true } },
        },
        orderBy: { fechaProgramada: "asc" },
      },
    },
  });

  if (!plan) return null;

  const propuestaItemsDetalle = plan.propuesta.items.length
    ? await prisma.items.findMany({
        where: { id: { in: plan.propuesta.items } },
        select: {
          id: true,
          name: true,
          tipoDeInformeId: true,
          esPlanificable: true,
          hasVariant: true,
          variantTypeId: true,
          variantType: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const variantTypeIds = Array.from(
    new Set(
      propuestaItemsDetalle
        .filter((item) => item.hasVariant && item.variantTypeId)
        .map((item) => item.variantTypeId as string),
    ),
  );

  const detallesVariante = variantTypeIds.length
    ? await prisma.detalleVariante.findMany({
        where: {
          is_active: true,
          variantTypeId: { in: variantTypeIds },
        },
        select: {
          id: true,
          name: true,
          variantTypeId: true,
          variantType: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  await refreshPlanTrabajoEstado(plan.id);

  return {
    ...(plan as unknown as Omit<PlanTrabajoWithProgramaciones, "propuestaItemsDetalle" | "detallesVariante">),
    propuestaItemsDetalle,
    detallesVariante,
  };
}

export async function createPlanTrabajoProgramacion(params: {
  planTrabajoId: string;
  itemId: string;
  fechaProgramada: string;
  precision: ProgramacionPrecision;
  clientLocationId?: string;
  detalleVarianteId?: string;
}) {
  const plan = await prisma.planTrabajo.findUnique({
    where: { id: params.planTrabajoId },
    include: {
      propuesta: { select: { id: true, clienteId: true, items: true } },
    },
  });

  if (!plan) throw new Error("Plan de trabajo no encontrado");

  if (!plan.propuesta.items.includes(params.itemId)) {
    throw new Error("El item no pertenece a la propuesta asociada al plan");
  }

  const item = await prisma.items.findUnique({
    where: { id: params.itemId },
    select: {
      id: true,
      tipoDeInformeId: true,
      esPlanificable: true,
      hasVariant: true,
      variantTypeId: true,
    },
  });

  if (!item) throw new Error("Item no encontrado");
  if (!item.tipoDeInformeId && !item.esPlanificable) {
    throw new Error("El item no es planificable");
  }

  const fecha = normalizeProgramacionDate(params.fechaProgramada, params.precision);
  assertDateInRange(fecha, plan.fechaInicio, plan.fechaFin);

  const requiereInforme = Boolean(item.tipoDeInformeId);

  if (requiereInforme) {
    if (!params.clientLocationId) {
      throw new Error("La locación del cliente es obligatoria para este item");
    }
    if (params.precision !== "dia") {
      throw new Error("Este item requiere una fecha completa (día)");
    }
  }

  const detalleVarianteId = await resolveDetalleVarianteId({
    item: { hasVariant: item.hasVariant, variantTypeId: item.variantTypeId },
    detalleVarianteId: params.detalleVarianteId,
  });

  const programacion = await prisma.planTrabajoProgramacion.create({
    data: {
      planTrabajoId: plan.id,
      itemId: params.itemId,
      fechaProgramada: fecha,
      precision: params.precision,
      clientLocationId: params.clientLocationId ?? null,
      detalleVarianteId,
    },
  });

  if (requiereInforme) {
    await prisma.informe.create({
      data: {
        clienteId: plan.clienteId,
        tipoDeInformeId: item.tipoDeInformeId!,
        propuestaId: plan.propuestaId,
        clientLocationId: params.clientLocationId!,
        fechaVencimiento: fecha,
        responsableConfeccion: "",
        planTrabajoProgramacionId: programacion.id,
      },
    });
  }

  await refreshPlanTrabajoEstado(plan.id);
  revalidatePath("/dashboard");

  return { success: true, programacionId: programacion.id };
}

export async function createPlanTrabajoProgramacionesMensuales(params: {
  planTrabajoId: string;
  itemId: string;
  mesInicio: string; // YYYY-MM
  detalleVarianteId?: string;
}) {
  const plan = await prisma.planTrabajo.findUnique({
    where: { id: params.planTrabajoId },
    include: {
      propuesta: { select: { id: true, clienteId: true, items: true } },
      programaciones: {
        select: { itemId: true, precision: true, fechaProgramada: true },
        where: { itemId: params.itemId },
      },
    },
  });

  if (!plan) throw new Error("Plan de trabajo no encontrado");

  if (!plan.propuesta.items.includes(params.itemId)) {
    throw new Error("El item no pertenece a la propuesta asociada al plan");
  }

  const item = await prisma.items.findUnique({
    where: { id: params.itemId },
    select: {
      id: true,
      tipoDeInformeId: true,
      esPlanificable: true,
      hasVariant: true,
    },
  });

  if (!item) throw new Error("Item no encontrado");
  if (item.tipoDeInformeId) {
    throw new Error("Este item requiere fecha diaria y no admite planificación mensual masiva");
  }
  if (!item.esPlanificable) {
    throw new Error("El item no es planificable");
  }
  if (item.hasVariant) {
    throw new Error("Los items con variantes no admiten planificación mensual masiva");
  }

  const planMonthStart = new Date(plan.fechaInicio.getFullYear(), plan.fechaInicio.getMonth(), 1);
  const planMonthEnd = new Date(plan.fechaFin.getFullYear(), plan.fechaFin.getMonth(), 1);

  const requestedStart = parseMonthOnlyToLocalNoon(params.mesInicio);
  if (!isValidDate(requestedStart)) {
    throw new Error("Mes de inicio inválido");
  }
  const mesInicioClamped =
    requestedStart.getTime() < planMonthStart.getTime() ? planMonthStart : requestedStart;

  const months: Date[] = [];
  let cursor = mesInicioClamped;
  while (cursor.getTime() <= planMonthEnd.getTime()) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  if (!months.length) {
    throw new Error("No hay meses dentro del rango del plan");
  }

  const existingMonthKeys = new Set(
    (plan.programaciones ?? [])
      .filter((p) => p.precision === "mes")
      .map((p) => toMonthOnlyString(p.fechaProgramada)),
  );

  const monthsToCreate = months.filter(
    (m) => !existingMonthKeys.has(toMonthOnlyString(m)),
  );

  if (!monthsToCreate.length) {
    return { success: true, programacionIds: [] };
  }

  await prisma.$transaction(async (tx) => {
    for (const monthDate of monthsToCreate) {
      assertDateInRange(monthDate, plan.fechaInicio, plan.fechaFin);
      await tx.planTrabajoProgramacion.create({
        data: {
          planTrabajoId: plan.id,
          itemId: params.itemId,
          fechaProgramada: monthDate,
          precision: "mes",
          clientLocationId: null,
        },
      });
    }
  });

  await refreshPlanTrabajoEstado(plan.id);
  revalidatePath("/dashboard");

  return { success: true, programacionIds: monthsToCreate.map((m) => toMonthOnlyString(m)) };
}

export async function marcarProgramacionEjecutada(params: {
  programacionId: string;
  ejecutada: boolean;
}) {
  const programacion = await prisma.planTrabajoProgramacion.findUnique({
    where: { id: params.programacionId },
    include: { planTrabajo: true, item: { select: { tipoDeInformeId: true } } },
  });

  if (!programacion) throw new Error("Programación no encontrada");

  if (programacion.item.tipoDeInformeId) {
    throw new Error("Los items con informe asociado se ejecutan desde Informes");
  }

  await prisma.planTrabajoProgramacion.update({
    where: { id: programacion.id },
    data: {
      ejecutadoAt: params.ejecutada ? new Date() : null,
      adjunto: params.ejecutada ? programacion.adjunto ?? null : null,
    },
  });

  await refreshPlanTrabajoEstado(programacion.planTrabajoId);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function ejecutarProgramacionConAdjunto(formData: FormData) {
  const programacionId = formData.get("programacionId") as string | null;
  const file = formData.get("file") as File | null;

  if (!programacionId || !file) {
    throw new Error("Faltan datos para ejecutar la programación");
  }

  const programacion = await prisma.planTrabajoProgramacion.findUnique({
    where: { id: programacionId },
    include: {
      planTrabajo: true,
      item: { select: { tipoDeInformeId: true } },
    },
  });

  if (!programacion) throw new Error("Programación no encontrada");
  if (programacion.item.tipoDeInformeId) {
    throw new Error("Los items con informe asociado se ejecutan desde Informes");
  }

  const key = `programaciones/${programacionId}`;
  await uploadFileToR2(file, key);

  await prisma.planTrabajoProgramacion.update({
    where: { id: programacionId },
    data: {
      ejecutadoAt: new Date(),
      adjunto: key,
    },
  });

  await refreshPlanTrabajoEstado(programacion.planTrabajoId);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function reprogramarPlanTrabajoProgramacion(params: {
  programacionId: string;
  fechaProgramada: string;
  precision: ProgramacionPrecision;
  rangoInicio: string;
  rangoFin: string;
}) {
  const rangoInicio = parseDateOnlyToLocalNoon(params.rangoInicio);
  const rangoFin = parseDateOnlyToLocalNoon(params.rangoFin);

  if (!isValidDate(rangoInicio) || !isValidDate(rangoFin)) {
    throw new Error("Fecha de inicio/fin inválida");
  }

  if (rangoInicio.getTime() > rangoFin.getTime()) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
  }

  const programacion = await prisma.planTrabajoProgramacion.findUnique({
    where: { id: params.programacionId },
    include: {
      planTrabajo: true,
      item: { select: { id: true, tipoDeInformeId: true } },
      informe: { select: { id: true } },
    },
  });

  if (!programacion) throw new Error("Programación no encontrada");

  const requiereInforme = Boolean(programacion.item.tipoDeInformeId);

  if (requiereInforme && params.precision !== "dia") {
    throw new Error("Este item requiere una fecha completa (día)");
  }

  const fecha = normalizeProgramacionDate(params.fechaProgramada, params.precision);
  assertDateInRange(fecha, rangoInicio, rangoFin);

  await prisma.planTrabajoProgramacion.update({
    where: { id: programacion.id },
    data: {
      fechaProgramada: fecha,
      precision: params.precision,
    },
  });

  if (programacion.informe) {
    await prisma.informe.update({
      where: { id: programacion.informe.id },
      data: { fechaVencimiento: fecha },
    });
  }

  await refreshPlanTrabajoEstado(programacion.planTrabajoId);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function previewUpdatePlanTrabajoFechas(params: {
  planTrabajoId: string;
  fechaInicio: string;
  fechaFin: string;
}) {
  const fechaInicio = parseDateOnlyToLocalNoon(params.fechaInicio);
  const fechaFin = parseDateOnlyToLocalNoon(params.fechaFin);

  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
    throw new Error("Fecha de inicio/fin inválida");
  }

  if (fechaInicio.getTime() > fechaFin.getTime()) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
  }

  const plan = await prisma.planTrabajo.findUnique({
    where: { id: params.planTrabajoId },
    include: {
      programaciones: {
        include: {
          item: { select: { id: true, name: true, tipoDeInformeId: true } },
          informe: { select: { id: true, estado: true, adjunto: true } },
        },
        orderBy: { fechaProgramada: "asc" },
      },
    },
  });

  if (!plan) throw new Error("Plan de trabajo no encontrado");

  const fueraDeRango = plan.programaciones
    .filter((p) => p.fechaProgramada.getTime() < fechaInicio.getTime() || p.fechaProgramada.getTime() > fechaFin.getTime())
    .map((p) => ({
      programacionId: p.id,
      itemId: p.itemId,
      itemName: p.item.name,
      fechaProgramada: p.precision === "mes" ? toMonthOnlyString(p.fechaProgramada) : toDateOnlyString(p.fechaProgramada),
      precision: p.precision,
      requiereInforme: Boolean(p.item.tipoDeInformeId),
      informeId: p.informe?.id ?? null,
    }));

  return {
    success: true,
    fueraDeRango,
  };
}

export async function updatePlanTrabajoFechas(params: {
  planTrabajoId: string;
  fechaInicio: string;
  fechaFin: string;
}) {
  const preview = await previewUpdatePlanTrabajoFechas(params);

  if (preview.fueraDeRango.length > 0) {
    return { success: false, reason: "Hay programaciones fuera del rango", fueraDeRango: preview.fueraDeRango };
  }

  const fechaInicio = parseDateOnlyToLocalNoon(params.fechaInicio);
  const fechaFin = parseDateOnlyToLocalNoon(params.fechaFin);

  await prisma.planTrabajo.update({
    where: { id: params.planTrabajoId },
    data: {
      fechaInicio,
      fechaFin,
    },
  });

  await refreshPlanTrabajoEstado(params.planTrabajoId);
  revalidatePath("/dashboard");

  return { success: true };
}
