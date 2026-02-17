"use server";

import prisma from "@/lib/db";
import { dbLogger } from "@/lib/logger";

export async function getClientes() {
  return prisma.cliente.findMany({
    include: {
      provincia: true,
      ciudad: true,
      clientLocations: {
        include: {
          provincia: true,
          ciudad: true,
        },
      },
    },
    orderBy: [
      { is_active: "desc" },
      { name: "asc" },
    ],
  });
}

export async function getClientesPaginated(params: {
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
          { name: { contains: params.search, mode: "insensitive" as const } },
          { cuit: { contains: params.search, mode: "insensitive" as const } },
          { email: { contains: params.search, mode: "insensitive" as const } },
        ],
      }),
      ...params.filters,
    }

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          provincia: true,
          ciudad: true,
          clientLocations: {
            include: {
              provincia: true,
              ciudad: true,
            },
          },
        },
        orderBy: [
          { is_active: "desc" },
          { name: "asc" },
        ],
      }),
      prisma.cliente.count({ where }),
    ])

    return {
      data,
      total,
      pageCount: Math.ceil(total / params.pageSize),
    }
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener clientes paginados")
    throw error
  }
}

export async function getClienteById(id: string){
  return prisma.cliente.findUnique({
    where: {
      id,
    },
    include: {
      provincia: true,
      ciudad: true,
      clientLocations: {
        include: {
          provincia: true,
          ciudad: true,
          cliente: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
     propuestas: {
      include: {
       cliente: true,
       servicios: true,

      }
     }
    }
  });
}

// Exportamos el tipo de retorno de la función
export type Cliente = Awaited<ReturnType<typeof getClientes>>[0];

export type ClienteById = Awaited<ReturnType<typeof getClienteById>>;