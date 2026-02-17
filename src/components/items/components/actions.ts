"use server";

import prisma from "@/lib/db";
import { dbLogger } from "@/lib/logger";

export async function getItems() {
  const items = await prisma.items.findMany({
    include: {
      tipoDeInforme: true,
    },
  });

  if (!items) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const itemsOrdenados = items.sort((a, b) => {
    // Si uno es activo y el otro no, el activo va primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return itemsOrdenados.map((item) => ({
    ...item,
    is_active: String(item.is_active)
  }))
}

export async function getActiveItems() {
  const items = await prisma.items.findMany({
    where: {
      is_active: true,
    },
    include: {
      tipoDeInforme: true,
    },
  });

  if (!items) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const itemsOrdenados = items.sort((a, b) => {

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return itemsOrdenados;
}

export async function getItemsPaginated(params: {
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
        ],
      }),
      ...params.filters,
    }

    const [items, total] = await Promise.all([
      prisma.items.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          tipoDeInforme: true,
        },
        orderBy: [
          { is_active: "desc" },
          { name: "asc" },
        ],
      }),
      prisma.items.count({ where }),
    ])

    const data = items.map((item) => ({
      ...item,
      is_active: String(item.is_active)
    }))

    return {
      data,
      total,
      pageCount: Math.ceil(total / params.pageSize),
    }
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener items paginados")
    throw error
  }
}




// Exportamos el tipo de retorno de la función
export type Item = Awaited<ReturnType<typeof getItems>>[0];
