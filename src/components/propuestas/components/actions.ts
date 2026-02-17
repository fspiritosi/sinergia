"use server";

import type { Moneda, PropuestaStatus } from "@/generated/client";
import prisma from "@/lib/db";
import { toDateOnlyString } from "@/lib/dates";
import { dbLogger } from "@/lib/logger";

export interface SerializedPropuesta {
  id: string;
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia: string | null;
  status: PropuestaStatus;
  items: string[];
  contacto: string | null;
  valor: number;
  moneda: Moneda;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: string;
    name: string;
  } | null;
  servicios: {
    id: string;
    name: string;
    type: string;
  } | null;
  condicionesParticulares: string[];
}

export async function getPropuestas(): Promise<SerializedPropuesta[]> {
  const propuestas = await prisma.propuestaTecnica.findMany({
    include: {
      cliente: {
        select: {
          id: true,
          name: true,
        },
      },
      servicios: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  if (!propuestas) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const propuestasOrdenados = propuestas.sort((a, b) => {
    // Si uno es activo y el otro no, el activo va primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.codigo.localeCompare(b.codigo, "es", { sensitivity: "base" });
  });

  return propuestasOrdenados.map((propuesta) => ({
    id: propuesta.id,
    codigo: propuesta.codigo,
    clienteId: propuesta.clienteId,
    servicioId: propuesta.servicioId,
    vigencia: propuesta.vigencia ? toDateOnlyString(propuesta.vigencia) : null,
    status: propuesta.status,
    items: propuesta.items,
    contacto: propuesta.contacto ?? null,
    valor: Number(propuesta.valor ?? 0),
    moneda: propuesta.moneda,
    is_active: propuesta.is_active,
    createdAt: propuesta.createdAt.toISOString(),
    updatedAt: propuesta.updatedAt.toISOString(),
    cliente: propuesta.cliente ?? null,
    servicios: propuesta.servicios ?? null,
    condicionesParticulares: propuesta.condicionesParticulares,
  }));
}

export async function getPropuestasPaginated(params: {
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
          { codigo: { contains: params.search, mode: "insensitive" as const } },
          { cliente: { name: { contains: params.search, mode: "insensitive" as const } } },
          { servicios: { name: { contains: params.search, mode: "insensitive" as const } } },
        ],
      }),
      ...params.filters,
    }

    const [propuestas, total] = await Promise.all([
      prisma.propuestaTecnica.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          cliente: {
            select: {
              id: true,
              name: true,
            },
          },
          servicios: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: [
          { is_active: "desc" },
          { codigo: "asc" },
        ],
      }),
      prisma.propuestaTecnica.count({ where }),
    ])

    const data = propuestas.map((propuesta) => ({
      id: propuesta.id,
      codigo: propuesta.codigo,
      clienteId: propuesta.clienteId,
      servicioId: propuesta.servicioId,
      vigencia: propuesta.vigencia ? toDateOnlyString(propuesta.vigencia) : null,
      status: propuesta.status,
      items: propuesta.items,
      contacto: propuesta.contacto ?? null,
      valor: Number(propuesta.valor ?? 0),
      moneda: propuesta.moneda,
      is_active: propuesta.is_active,
      createdAt: propuesta.createdAt.toISOString(),
      updatedAt: propuesta.updatedAt.toISOString(),
      cliente: propuesta.cliente ?? null,
      servicios: propuesta.servicios ?? null,
      condicionesParticulares: propuesta.condicionesParticulares,
    }))

    return {
      data,
      total,
      pageCount: Math.ceil(total / params.pageSize),
    }
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener propuestas paginadas")
    throw error
  }
}


// Exportamos el tipo de retorno de la función
export type PropuestaTecnica = SerializedPropuesta;
