"use server";

import prisma from "@/lib/db";
import type { Moneda, PropuestaStatus } from "@/generated/client";

export interface SerializedPropuesta {
  id: string;
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia: string | null;
  status: PropuestaStatus;
  items: string[];
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
  } | null;
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
    vigencia: propuesta.vigencia ? propuesta.vigencia.toISOString() : null,
    status: propuesta.status,
    items: propuesta.items,
    valor: Number(propuesta.valor ?? 0),
    moneda: propuesta.moneda,
    is_active: propuesta.is_active,
    createdAt: propuesta.createdAt.toISOString(),
    updatedAt: propuesta.updatedAt.toISOString(),
    cliente: propuesta.cliente ?? null,
    servicios: propuesta.servicios ?? null,
  }));
}


// Exportamos el tipo de retorno de la función
export type PropuestaTecnica = SerializedPropuesta;
