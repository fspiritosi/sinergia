"use server";

import prisma from "@/lib/db";

import type { Prisma } from "@/generated/client";

export type TipoVarianteOption = {
  id: string;
  name: string;
};

type TipoVarianteResult = Prisma.TipoDeVarianteGetPayload<Record<string, never>>;

function orderTiposVariante(list: TipoVarianteResult[]) {
  return list.sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

export async function getTiposVariante(): Promise<TipoVarianteResult[]> {
  const tipos = await prisma.tipoDeVariante.findMany();

  if (!tipos) {
    return [];
  }

  return orderTiposVariante(tipos);
}

export async function getActiveTiposVariante(): Promise<TipoVarianteOption[]> {
  const tipos = await prisma.tipoDeVariante.findMany({
    where: {
      is_active: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!tipos) {
    return [];
  }

  return tipos;
}

export type TipoDeVariante = TipoVarianteResult;
