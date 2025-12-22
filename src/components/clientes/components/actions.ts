"use server";

import prisma from "@/lib/db";

export async function getClientes() {
  return prisma.cliente.findMany({
    orderBy: [
      { is_active: "desc" },
      { name: "asc" },
    ],
  });
}

// Exportamos el tipo de retorno de la función
export type Cliente = Awaited<ReturnType<typeof getClientes>>[0];
