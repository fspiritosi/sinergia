"use server";

import prisma from "@/lib/db";
import { inspeccionRepository } from "@/repositories/inspeccion.repository";
import { dbLogger } from "@/lib/logger";

export async function getInspeccionesPaginated(params: {
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
        { lugarTexto: { contains: params.search, mode: "insensitive" as const } },
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
      params.filters?.tipo &&
      Array.isArray(params.filters.tipo) &&
      params.filters.tipo.length > 0
    ) {
      where.tipo = { in: params.filters.tipo };
    }

    const [data, total, estadoGroupBy] = await Promise.all([
      prisma.inspeccionFormulario.findMany({
        where,
        skip,
        take: params.pageSize,
        include: {
          cliente: { select: { id: true, name: true } },
          realizadoPor: { select: { id: true, name: true, email: true } },
          clientLocation: { select: { id: true, name: true } },
        },
        orderBy: { fecha: "desc" },
      }),
      prisma.inspeccionFormulario.count({ where }),
      prisma.inspeccionFormulario.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]);

    const facetCounts: Record<string, Record<string, number>> = {
      estado: Object.fromEntries(estadoGroupBy.map((r) => [r.estado, r._count._all])),
    };

    return {
      data: data.map((i) => ({
        id: i.id,
        clienteNombre: i.cliente.name,
        tipo: i.tipo,
        fecha: i.fecha.toISOString(),
        fechaInspeccion: i.fechaInspeccion?.toISOString() ?? null,
        estado: i.estado,
        realizadoPorNombre: i.realizadoPor.name ?? i.realizadoPor.email,
        lugarNombre: i.clientLocation?.name ?? i.lugarTexto ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / params.pageSize),
      facetCounts,
    };
  } catch (error) {
    dbLogger.error({ error, params }, "Error al obtener inspecciones paginadas");
    throw error;
  }
}

export async function getInspeccionById(id: string) {
  const inspeccion = await inspeccionRepository.findByIdWithRespuestas(id);
  if (!inspeccion) return null;
  return inspeccion;
}

export async function getSeccionesConPreguntas() {
  return prisma.seccionInspeccion.findMany({
    where: { parentId: null },
    include: {
      hijas: {
        include: {
          preguntas: {
            where: { parentPreguntaId: null },
            include: {
              acciones: { orderBy: { orden: "asc" } },
              hijasCondicionales: {
                include: {
                  acciones: { orderBy: { orden: "asc" } },
                },
                orderBy: { orden: "asc" },
              },
            },
            orderBy: { orden: "asc" },
          },
        },
        orderBy: { orden: "asc" },
      },
      preguntas: {
        where: { parentPreguntaId: null },
        include: {
          acciones: { orderBy: { orden: "asc" } },
          hijasCondicionales: {
            include: {
              acciones: { orderBy: { orden: "asc" } },
            },
            orderBy: { orden: "asc" },
          },
        },
        orderBy: { orden: "asc" },
      },
    },
    orderBy: { orden: "asc" },
  });
}

export async function getMisBorradores(userId: string) {
  return inspeccionRepository.findBorradorByUser(userId);
}
