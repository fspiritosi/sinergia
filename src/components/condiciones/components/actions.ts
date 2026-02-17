"use server";

import prisma from "@/lib/db";

export async function getCondiciones() {
  const condiciones = await prisma.condicion.findMany();

  if (!condiciones) return [];

  // Ordenamiento: por tipo (general primero), luego por order, luego activos primero
  const condicionesOrdenadas = condiciones.sort((a, b) => {
    // Primero por tipo: general antes que particular
    if (a.tipo !== b.tipo) {
      return a.tipo === "general" ? -1 : 1;
    }

    // Dentro del mismo tipo, por order ascendente
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    // Si tienen mismo order, activos primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Por último, alfabéticamente por título
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });

  return condicionesOrdenadas;
}

export async function getActiveCondiciones() {
  const condiciones = await prisma.condicion.findMany({
    where: {
      is_active: true,
    },
  });

  if (!condiciones) return [];

  // Mismo ordenamiento que getCondiciones
  const condicionesOrdenadas = condiciones.sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === "general" ? -1 : 1;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });

  return condicionesOrdenadas;
}

export async function getActiveCondicionesByTipo(tipo: "general" | "particular") {
  const condiciones = await prisma.condicion.findMany({
    where: {
      is_active: true,
      tipo,
    },
  });

  if (!condiciones) return [];

  // Ordenar por order ascendente
  const condicionesOrdenadas = condiciones.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });

  return condicionesOrdenadas;
}

// Exportamos el tipo de retorno de la función
export type Condicion = Awaited<ReturnType<typeof getCondiciones>>[0];
