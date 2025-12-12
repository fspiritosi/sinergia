"use server";

import prisma from "@/lib/db";

export async function getTiposInforme() {
  const tiposInforme = await prisma.tipoDeInforme.findMany();

  if (!tiposInforme) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const tipoDeInformeOrdenados = tiposInforme.sort((a, b) => {
    // Si uno es activo y el otro no, el activo va primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return tipoDeInformeOrdenados;
}

export async function getActiveTiposInforme() {
  const tiposInforme = await prisma.tipoDeInforme.findMany({
    where: {
      is_active: true,
    },
  });

  if (!tiposInforme) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const tipoDeInformeOrdenados = tiposInforme.sort((a, b) => {
    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return tipoDeInformeOrdenados;
}

// Exportamos el tipo de retorno de la función
export type TipoDeInforme = Awaited<ReturnType<typeof getTiposInforme>>[0];
