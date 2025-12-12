"use server";

import prisma from "@/lib/db";

export async function getClientLocations() {
  const clientLocations = await prisma.clientLocations.findMany({
    include:{
      cliente:{
        select:{
          id:true,
          name:true,
        }
      }
    }
  });

  if (!clientLocations) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const clientLocationsOrdenados = clientLocations.sort((a, b) => {
    // Si uno es activo y el otro no, el activo va primero
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;

    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return clientLocationsOrdenados;
}

export async function getActiveClientLocations() {
  const clientLocations = await prisma.clientLocations.findMany({
    where: {
      is_active: true,
    },
  });

  if (!clientLocations) return [];

  // Ordenamiento personalizado: activos primero (alfabéticamente), luego inactivos (alfabéticamente)
  const clientLocationsOrdenados = clientLocations.sort((a, b) => {
    // Si ambos tienen el mismo estado (ambos activos o ambos inactivos), ordenar alfabéticamente por nombre
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return clientLocationsOrdenados;
}

// Exportamos el tipo de retorno de la función
export type clientLocations = Awaited<ReturnType<typeof getClientLocations>>[0];
