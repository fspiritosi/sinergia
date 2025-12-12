"use server";


import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ClientLocations } from "@/generated/client"




export async function createClientLocation(data: ClientLocations) {
  try {
    const clientLocation: ClientLocations = await prisma.clientLocations.create({
      data: {
        name: data.name,
        clienteId: data.clienteId,
        is_active: data.is_active,
    }
  });

    if (!clientLocation) {
      console.error("Error creating client location:");
      throw new Error("Error al crear la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    console.error("Error in createServicio:", error);
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
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!clientLocation) {
      console.error("Error updating clientLocation:");
      throw new Error("Error al actualizar la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    console.error("Error in updateClientLocation:", error);
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
      console.error("Error deleting clientLocation:");
      throw new Error("Error al eliminar la locacion del cliente");
    }

    revalidatePath("/dashboard/clientes/locaciones");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteClientLocation:", error);
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
            console.error("ClientLocation no encontrado:", id);
            throw new Error("ClientLocation no encontrado");
        }

        
        return { clientLocation };
    } catch (error) {
        console.error("Error al obtener clientLocation:", error);
        throw error;
    }
}



