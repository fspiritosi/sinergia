"use server";

import { clienteRepository } from "@/repositories/cliente.repository";
import prisma from "@/lib/db";
import { dbLogger } from "@/lib/logger";

export async function getClientes() {
  return clienteRepository.findMany();
}

export async function getClientesPaginated(params: {
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
        { name: { contains: params.search, mode: "insensitive" as const } },
        { cuit: { contains: params.search, mode: "insensitive" as const } },
        { email: { contains: params.search, mode: "insensitive" as const } },
      ];
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

    if (
      params.filters?.createdAt &&
      Array.isArray(params.filters.createdAt) &&
      params.filters.createdAt.length > 0
    ) {
      const now = new Date();
      const dateConditions: Date[] = [];
      params.filters.createdAt.forEach((filterValue: string) => {
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
        where.createdAt = { gte: oldestDate };
      }
    }

    const [clientes, total, isActiveGroupBy] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          provincia: { select: { id: true, nombre: true } },
          ciudad: { select: { id: true, nombre: true } },
        },
        orderBy: [{ is_active: "desc" }, { name: "asc" }],
      }),
      prisma.cliente.count({ where }),
      prisma.cliente.groupBy({ by: ["is_active"], _count: { _all: true } }),
    ]);

    const facetCounts: Record<string, Record<string, number>> = {
      is_active: Object.fromEntries(
        isActiveGroupBy.map((r) => [String(r.is_active), r._count._all])
      ),
    };

    return {
      data: clientes,
      total,
      pageCount: Math.ceil(total / params.pageSize),
      facetCounts,
    };
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener clientes paginados");
    throw error;
  }
}

export async function getClienteById(id: string) {
  return clienteRepository.findByIdWithDetails(id);
}

// Exportamos el tipo de retorno de la función
export type Cliente = Awaited<ReturnType<typeof getClientes>>[0];

export type ClienteById = Awaited<ReturnType<typeof getClienteById>>;
