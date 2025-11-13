"use server";

import prisma from "@/lib/db";

export async function getServicios() {
  const servicios = await prisma.servicio.findMany();

  if (!servicios) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const serviciosOrdenados = servicios.sort((a, b) => {
    // Si uno es activo y el otro no, el activo va primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return serviciosOrdenados;
}

export async function getActiveServicios() {
  const servicios = await prisma.servicio.findMany({
    where: {
      is_active: true,
    },
  });

  if (!servicios) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const serviciosOrdenados = servicios.sort((a, b) => {
    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return serviciosOrdenados;
}

// Exportamos el tipo de retorno de la función
export type Servicio = Awaited<ReturnType<typeof getServicios>>[0];
