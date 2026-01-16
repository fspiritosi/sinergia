"use server";

import prisma from "@/lib/db";
import type { Prisma } from "@/generated/client";

type DetalleVarianteResult = Prisma.DetalleVarianteGetPayload<{
  include: {
    variantType: true;
  };
}>;

function orderDetallesVariante(list: DetalleVarianteResult[]) {
  return list.sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

export async function getDetallesVariante(): Promise<DetalleVarianteResult[]> {
  const detalles = await prisma.detalleVariante.findMany({
    include: {
      variantType: true,
    },
  });

  if (!detalles) {
    return [];
  }

  return orderDetallesVariante(detalles);
}

export async function getActiveDetallesVariante(): Promise<DetalleVarianteResult[]> {
  const detalles = await prisma.detalleVariante.findMany({
    where: {
      is_active: true,
    },
    include: {
      variantType: true,
    },
  });

  if (!detalles) {
    return [];
  }

  return orderDetallesVariante(detalles);
}

export type DetalleVariante = DetalleVarianteResult;

export async function getActiveDetallesVarianteByType(
  variantTypeId: string,
): Promise<DetalleVarianteResult[]> {
  if (!variantTypeId) {
    return [];
  }

  const detalles = await prisma.detalleVariante.findMany({
    where: {
      is_active: true,
      variantTypeId,
    },
    include: {
      variantType: true,
    },
  });

  if (!detalles) {
    return [];
  }

  return orderDetallesVariante(detalles);
}
