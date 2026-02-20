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
    is_active: String(item.is_active),
  }));
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
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}) {
  try {
    const skip = (params.page - 1) * params.pageSize;

    const where: any = {};

    if (params.search) {
      where.OR = [{ name: { contains: params.search, mode: "insensitive" as const } }];
    }

    if (
      params.filters?.is_active &&
      Array.isArray(params.filters.is_active) &&
      params.filters.is_active.length > 0
    ) {
      const boolValues = params.filters.is_active.map((v: string) => v === "true");
      if (boolValues.length === 1) {
        where.is_active = boolValues[0];
      }
      // si se seleccionan ambos (true y false), no aplicar filtro (mostrar todos)
    }

    const [items, total, isActiveGroupBy] = await Promise.all([
      prisma.items.findMany({
        where,
        skip,
        take: params.pageSize,
        include: { tipoDeInforme: true },
        orderBy: [{ is_active: "desc" }, { name: "asc" }],
      }),
      prisma.items.count({ where }),
      prisma.items.groupBy({ by: ["is_active"], _count: { _all: true } }),
    ]);

    const facetCounts: Record<string, Record<string, number>> = {
      is_active: Object.fromEntries(
        isActiveGroupBy.map((r) => [String(r.is_active), r._count._all])
      ),
    };

    const data = items.map((item) => ({
      ...item,
      is_active: String(item.is_active),
    }));

    return {
      data,
      total,
      pageCount: Math.ceil(total / params.pageSize),
      facetCounts,
    };
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener items paginados");
    throw error;
  }
}

// Exportamos el tipo de retorno de la función
export type Item = Awaited<ReturnType<typeof getItems>>[0];
