"use server";

import prisma from "@/lib/db";

export async function getClientes() {
  return prisma.cliente.findMany({
    include: {
      provincia: true,
      ciudad: true,
      clientLocations: {
        include: {
          provincia: true,
          ciudad: true,
        },
      },
    },
    orderBy: [
      { is_active: "desc" },
      { name: "asc" },
    ],
  });
}

export async function getClienteById(id: string){
  return prisma.cliente.findUnique({
    where: {
      id,
    },
    include: {
      provincia: true,
      ciudad: true,
      clientLocations: {
        include: {
          provincia: true,
          ciudad: true,
          cliente: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
     propuestas: {
      include: {
       cliente: true,
       servicios: true,

      }
     }
    }
  });
}

// Exportamos el tipo de retorno de la función
export type Cliente = Awaited<ReturnType<typeof getClientes>>[0];

export type ClienteById = Awaited<ReturnType<typeof getClienteById>>;