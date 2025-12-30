"use server";

import prisma from "@/lib/db";

export async function getClientLocations() {
  return prisma.clientLocations.findMany({
    include: {
      cliente: {
        select: {
          id: true,
          name: true,
        },
      },
      provincia: true,
      ciudad: true,
    },
    orderBy: [
      { is_active: "desc" },
      { name: "asc" },
    ],
  });
}

export async function getActiveClientLocations(clienteId?: string) {
  return prisma.clientLocations.findMany({
    where: {
      is_active: true,
      ...(clienteId ? { clienteId } : {}),
    },
    include: {
      provincia: true,
      ciudad: true,
      cliente: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ name: "asc" }],
  });
}

// Exportamos los tipos de retorno de las funciones
export type clientLocations = Awaited<ReturnType<typeof getClientLocations>>[0];
export type ClientLocationBasic = Awaited<ReturnType<typeof getActiveClientLocations>>[0];
