"use server";

import prisma from "@/lib/db";
import type { Prisma } from "@/generated/client";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { refreshPlanTrabajoEstado } from "@/components/planesTrabajo/components/actions";
import { parseCalendarStringToDate, toDateOnlyString } from "@/lib/dates";
import { dbLogger } from "@/lib/logger";

type InformeWithRelations = Prisma.InformeGetPayload<{
  include: {
    cliente: { select: { id: true, name: true } };
    tipoDeInforme: { select: { id: true, name: true } };
    clientLocation: { select: { id: true, name: true } };
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
    clientLocation: i.clientLocation ? { id: i.clientLocation.id, name: i.clientLocation.name } : null,
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
    orderBy: [
      { estado: "asc" },
      { fechaVencimiento: "asc" },
    ],
  });

  if (!informes) return [];

  return informes.map(serializeInforme);
}

export async function getInformesPaginated(params: {
  page: number
  pageSize: number
  search?: string
  filters?: Record<string, any>
}) {
  try {
    const skip = (params.page - 1) * params.pageSize

    const where = {
      ...(params.search && {
        OR: [
          { cliente: { name: { contains: params.search, mode: "insensitive" as const } } },
          { tipoDeInforme: { name: { contains: params.search, mode: "insensitive" as const } } },
        ],
      }),
      ...params.filters,
    }

    const [informes, total] = await Promise.all([
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
        orderBy: [
          { estado: "asc" },
          { fechaVencimiento: "asc" },
        ],
      }),
      prisma.informe.count({ where }),
    ])

    const data = informes.map(serializeInforme)

    return {
      data,
      total,
      pageCount: Math.ceil(total / params.pageSize),
    }
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener informes paginados")
    throw error
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
  id: string
  clienteId: string
  clienteNombre: string
  propuestaId: string
  propuestaCodigo: string
  tipoDeInformeId: string
  tipoDeInformeNombre: string
  fechaVencimiento: string
  estado: string
  adjunto: string | null
}

export async function getInformesByRange(params: {
  from: string
  to: string
}): Promise<InformeCalendarItem[]> {
  const from = new Date(params.from)
  const to = new Date(params.to)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido")
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
  })

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
  }))
}

export async function createInforme(data: any) {
  const informe = await prisma.informe.create({
    data,
  });

  revalidatePath("/dashboard/informes");
  return informe;
}

export async function completarInforme(formData: FormData) {
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

export async function updateInforme(id: string, data: any) {
  const informe = await prisma.informe.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/informes");
  return informe;
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
