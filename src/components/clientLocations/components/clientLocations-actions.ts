"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ClientLocations } from "@/generated/client";
import { dbLogger } from "@/lib/logger";




export async function createClientLocation(data: ClientLocations) {
  try {
    const clientLocation: ClientLocations = await prisma.clientLocations.create({
      data: {
        name: data.name,
        clienteId: data.clienteId,
        provinciaId: data.provinciaId,
        ciudadId: data.ciudadId,
        is_active: data.is_active,
    }
  });

    if (!clientLocation) {
      dbLogger.error({ locationName: data.name }, "Error al crear locación de cliente: registro no creado");
      throw new Error("Error al crear la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, locationName: data.name }, "Error al crear locación de cliente");
    throw error;
  }
}

export async function updateClientLocation(data: Partial<ClientLocations>) {

  try {
    const clientLocation = await prisma.clientLocations.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,    
        clienteId: data.clienteId,
        provinciaId: data.provinciaId,
        ciudadId: data.ciudadId,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!clientLocation) {
      dbLogger.error({ locationId: data.id }, "Error al actualizar locación de cliente: registro no actualizado");
      throw new Error("Error al actualizar la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, locationId: data.id }, "Error al actualizar locación de cliente");
    throw error;
  }
}

export async function deleteClientLocation(id: string) {
  try {
    const clientLocation = await prisma.clientLocations.delete({
      where: {
        id: id,
      },
    });

    if (!clientLocation) {
      dbLogger.error({ locationId: id }, "Error al eliminar locación de cliente: registro no eliminado");
      throw new Error("Error al eliminar la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, locationId: id }, "Error al eliminar locación de cliente");
    throw error;
  }
}

interface ClientLocationDetail {
    clientLocation: ClientLocations;
}

export async function getClientLocation(id: string): Promise<ClientLocationDetail> {
    try {
        const clientLocation = await prisma.clientLocations.findUnique({
            where: {
                id,
            },
        });

        if (!clientLocation) {
            dbLogger.error({ locationId: id }, "ClientLocation no encontrado");
            throw new Error("ClientLocation no encontrado");
        }


        return { clientLocation };
    } catch (error) {
        dbLogger.error({ error, locationId: id }, "Error al obtener clientLocation");
        throw error;
    }
}



