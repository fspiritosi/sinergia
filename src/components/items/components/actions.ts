"use server";

import prisma from "@/lib/db";

export async function getItems() {
  const items = await prisma.items.findMany();

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
  });

  if (!items) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const itemsOrdenados = items.sort((a, b) => {

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return itemsOrdenados;
}




// Exportamos el tipo de retorno de la función
export type Item = Awaited<ReturnType<typeof getItems>>[0];
