"use server";

import prisma from "@/lib/db";
import type { Prisma } from "@/generated/client";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { refreshPlanTrabajoEstado } from "@/components/planesTrabajo/components/actions";
import { parseCalendarStringToDate, toDateOnlyString } from "@/lib/dates";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { assertInformeEditable } from "./informe-guards";
import { validateInformeUpdate, type InformeUpdateInput } from "@/lib/validations/informe.schema";

type InformeWithRelations = Prisma.InformeGetPayload<{
  include: {
    cliente: { select: { id: true; name: true } };
    tipoDeInforme: { select: { id: true; name: true } };
    clientLocation: { select: { id: true; name: true } };
    propuesta: {
      select: {
        id: true;
        codigo: true;
        clienteId: true;
        servicioId: true;
        vigencia: true;
        status: true;
        items: true;
        contacto: true;
        valor: true;
        moneda: true;
        is_active: true;
        condicionesParticulares: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;

export interface SerializedInforme {
  id: string;
  cliente: { id: string; name: string } | null;
  tipoDeInforme: { id: string; name: string } | null;
  clientLocation: { id: string; name: string } | null;
  propuesta: {
    id: string;
    codigo: string;
    clienteId: string;
    servicioId: string;
    vigencia: string | null;
    status: string;
    items: string[];
    contacto: string | null;
    valor: number;
    moneda: string;
    is_active: boolean;
    condicionesParticulares: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  fechaVencimiento: string;
  estado: string;
  adjunto: string | null;
  responsableConfeccion: string | null;
  createdAt: string;
  updatedAt: string;
}

function serializeInforme(i: InformeWithRelations): SerializedInforme {
  return {
    id: i.id,
    cliente: i.cliente ? { id: i.cliente.id, name: i.cliente.name } : null,
    tipoDeInforme: i.tipoDeInforme ? { id: i.tipoDeInforme.id, name: i.tipoDeInforme.name } : null,
    clientLocation: i.clientLocation
      ? { id: i.clientLocation.id, name: i.clientLocation.name }
      : null,
    propuesta: i.propuesta
      ? {
          id: i.propuesta.id,
          codigo: i.propuesta.codigo,
          clienteId: i.propuesta.clienteId,
          servicioId: i.propuesta.servicioId,
          vigencia: i.propuesta.vigencia ? toDateOnlyString(i.propuesta.vigencia) : null,
          status: i.propuesta.status,
          items: i.propuesta.items,
          contacto: i.propuesta.contacto ?? null,
          valor: Number(i.propuesta.valor ?? 0),
          moneda: i.propuesta.moneda,
          is_active: i.propuesta.is_active,
          condicionesParticulares: i.propuesta.condicionesParticulares,
          createdAt: i.propuesta.createdAt.toISOString(),
          updatedAt: i.propuesta.updatedAt.toISOString(),
        }
      : null,
    fechaVencimiento: toDateOnlyString(i.fechaVencimiento),
    estado: i.estado,
    adjunto: i.adjunto ?? null,
    responsableConfeccion: i.responsableConfeccion ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export async function getInformes(): Promise<SerializedInforme[]> {
  const informes = await prisma.informe.findMany({
    include: {
      cliente: { select: { id: true, name: true } },
      tipoDeInforme: { select: { id: true, name: true } },
      clientLocation: { select: { id: true, name: true } },
      propuesta: {
        select: {
          id: true,
          codigo: true,
          clienteId: true,
          servicioId: true,
          vigencia: true,
          status: true,
          items: true,
          contacto: true,
          valor: true,
          moneda: true,
          is_active: true,
          condicionesParticulares: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [{ estado: "asc" }, { fechaVencimiento: "asc" }],
  });

  if (!informes) return [];

  return informes.map(serializeInforme);
}

export async function getInformesPaginated(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}) {
  try {
    const skip = (params.page - 1) * params.pageSize;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { cliente: { name: { contains: params.search, mode: "insensitive" as const } } },
        { tipoDeInforme: { name: { contains: params.search, mode: "insensitive" as const } } },
      ];
    }

    if (
      params.filters?.estado &&
      Array.isArray(params.filters.estado) &&
      params.filters.estado.length > 0
    ) {
      where.estado = { in: params.filters.estado };
    }

    if (
      params.filters?.fechaVencimiento &&
      Array.isArray(params.filters.fechaVencimiento) &&
      params.filters.fechaVencimiento.length > 0
    ) {
      const now = new Date();
      const dateConditions: Date[] = [];
      params.filters.fechaVencimiento.forEach((filterValue: string) => {
        let dateFrom: Date | null = null;
        switch (filterValue) {
          case "today":
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case "quarter":
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case "year":
            dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }
        if (dateFrom) dateConditions.push(dateFrom);
      });
      if (dateConditions.length > 0) {
        const oldestDate = new Date(Math.min(...dateConditions.map((d) => d.getTime())));
        where.fechaVencimiento = { gte: oldestDate };
      }
    }

    const [informes, total, estadoGroupBy] = await Promise.all([
      prisma.informe.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          cliente: { select: { id: true, name: true } },
          tipoDeInforme: { select: { id: true, name: true } },
          clientLocation: { select: { id: true, name: true } },
          propuesta: {
            select: {
              id: true,
              codigo: true,
              clienteId: true,
              servicioId: true,
              vigencia: true,
              status: true,
              items: true,
              contacto: true,
              valor: true,
              moneda: true,
              is_active: true,
              condicionesParticulares: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ estado: "asc" }, { fechaVencimiento: "asc" }],
      }),
      prisma.informe.count({ where }),
      prisma.informe.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    const facetCounts: Record<string, Record<string, number>> = {
      estado: Object.fromEntries(estadoGroupBy.map((r) => [r.estado, r._count._all])),
    };

    return {
      data: informes.map(serializeInforme),
      total,
      pageCount: Math.ceil(total / params.pageSize),
      facetCounts,
    };
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener informes paginados");
    throw error;
  }
}

export async function getPendingInformes(): Promise<SerializedInforme[]> {
  const informes = await prisma.informe.findMany({
    where: {
      estado: "pendiente",
    },
    include: {
      cliente: { select: { id: true, name: true } },
      tipoDeInforme: { select: { id: true, name: true } },
      clientLocation: { select: { id: true, name: true } },
      propuesta: {
        select: {
          id: true,
          codigo: true,
          clienteId: true,
          servicioId: true,
          vigencia: true,
          status: true,
          items: true,
          contacto: true,
          valor: true,
          moneda: true,
          is_active: true,
          condicionesParticulares: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [{ fechaVencimiento: "asc" }],
  });

  if (!informes) return [];

  return informes.map(serializeInforme);
}

export type InformeCalendarItem = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  propuestaId: string;
  propuestaCodigo: string;
  tipoDeInformeId: string;
  tipoDeInformeNombre: string;
  fechaVencimiento: string;
  estado: string;
  adjunto: string | null;
};

export async function getInformesByRange(params: {
  from: string;
  to: string;
}): Promise<InformeCalendarItem[]> {
  const from = new Date(params.from);
  const to = new Date(params.to);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido");
  }

  const informes = await prisma.informe.findMany({
    where: {
      fechaVencimiento: {
        gte: from,
        lte: to,
      },
    },
    include: {
      cliente: { select: { id: true, name: true } },
      propuesta: { select: { id: true, codigo: true } },
      tipoDeInforme: { select: { id: true, name: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  });

  return informes.map((i) => ({
    id: i.id,
    clienteId: i.cliente.id,
    clienteNombre: i.cliente.name,
    propuestaId: i.propuesta.id,
    propuestaCodigo: i.propuesta.codigo,
    tipoDeInformeId: i.tipoDeInforme.id,
    tipoDeInformeNombre: i.tipoDeInforme.name,
    fechaVencimiento: toDateOnlyString(i.fechaVencimiento),
    estado: String(i.estado),
    adjunto: i.adjunto ?? null,
  }));
}

export async function createInforme(data: any) {
  await requirePermission(PERMISSIONS.INFORMES_CREATE);
  const informe = await prisma.informe.create({
    data,
  });

  revalidatePath("/dashboard/informes");
  return informe;
}

export async function completarInforme(formData: FormData) {
  await requirePermission(PERMISSIONS.INFORMES_DELIVER);
  const file = formData.get("file") as File | null;
  const informeId = formData.get("informeId") as string | null;
  const responsable = formData.get("responsable") as string | null;

  if (!file || !informeId || !responsable) {
    throw new Error("Faltan datos requeridos");
  }

  const key = `informes/${informeId}`;
  await uploadFileToR2(file, key);

  const updated = await prisma.informe.update({
    where: { id: informeId },
    data: {
      estado: "entregado",
      responsableConfeccion: responsable,
      adjunto: key,
    },
    select: {
      id: true,
      planTrabajoProgramacionId: true,
    },
  });

  if (updated.planTrabajoProgramacionId) {
    const programacion = await prisma.planTrabajoProgramacion.update({
      where: { id: updated.planTrabajoProgramacionId },
      data: {
        ejecutadoAt: new Date(),
      },
      select: {
        planTrabajoId: true,
      },
    });

    await refreshPlanTrabajoEstado(programacion.planTrabajoId);

    revalidatePath("/dashboard/planes");
    revalidatePath(`/dashboard/planes/${programacion.planTrabajoId}`);
  }

  revalidatePath("/dashboard/informes");
}

export async function updateInforme(id: string, data: InformeUpdateInput) {
  await requirePermission(PERMISSIONS.INFORMES_UPDATE);

  const validated = validateInformeUpdate(data);

  const existing = await prisma.informe.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!existing) {
    throw new Error("Informe no encontrado");
  }

  assertInformeEditable(existing);

  const informe = await prisma.informe.update({
    where: { id },
    data: {
      tipoDeInformeId: validated.tipoDeInformeId,
      clientLocationId: validated.clientLocationId,
      responsableConfeccion: validated.responsableConfeccion ?? "",
      fechaVencimiento: parseCalendarStringToDate(validated.fechaVencimiento),
    },
  });

  revalidatePath("/dashboard/informes");
  return informe;
}

export async function deleteInforme(id: string) {
  await requirePermission(PERMISSIONS.INFORMES_DELETE);

  const existing = await prisma.informe.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!existing) {
    throw new Error("Informe no encontrado");
  }

  assertInformeEditable(existing);

  try {
    await prisma.informe.delete({ where: { id } });
  } catch (error) {
    dbLogger.error({ error, informeId: id }, "Error al eliminar informe");
    throw error;
  }

  revalidatePath("/dashboard/informes");
  return { success: true };
}

interface GenerateInformesInput {
  propuestaId: string;
  fechaVencimiento: string;
  clientLocationId: string;
}

export async function generateInformesFromPropuesta({
  propuestaId,
  fechaVencimiento,
  clientLocationId,
}: GenerateInformesInput) {
  await requirePermission(PERMISSIONS.INFORMES_CREATE);
  const propuesta = await prisma.propuestaTecnica.findUnique({
    where: { id: propuestaId },
    include: {
      servicios: true,
    },
  });

  if (!propuesta) {
    throw new Error("Propuesta no encontrada");
  }

  if (propuesta.servicios.type !== "unitario") {
    return { success: false, reason: "Servicio no es unitario" };
  }

  const existingCount = await prisma.informe.count({
    where: { propuestaId },
  });

  if (existingCount > 0) {
    return {
      success: false,
      reason: "Los informes ya fueron generados para esta propuesta",
    };
  }

  const fecha = parseCalendarStringToDate(fechaVencimiento);

  const items = await prisma.items.findMany({
    where: {
      id: { in: propuesta.items },
      tipoDeInformeId: { not: null },
    },
  });

  if (!items.length) {
    return {
      success: false,
      reason: "No hay items con tipo de informe asociado",
    };
  }

  await prisma.informe.createMany({
    data: items.map((item) => ({
      clienteId: propuesta.clienteId,
      tipoDeInformeId: item.tipoDeInformeId!,
      propuestaId,
      clientLocationId,
      fechaVencimiento: fecha,
      responsableConfeccion: "",
    })),
  });

  revalidatePath("/dashboard/informes");
  return { success: true, createdCount: items.length };
}

export type Informe = Awaited<ReturnType<typeof getInformes>>[0];
