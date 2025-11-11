"use server";


import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Cliente as ClienteType } from "@/generated/client"




export async function createCliente(data: ClienteType) {
  console.log('create client data',data);
  try {
    const cliente: ClienteType = await prisma.cliente.create({
      data: {
        name: data.name,
        cuit: data.cuit,  
        email: data.email,
        telefono: data.telefono,
        domicilio: data.domicilio,
        is_active: data.is_active,
    }
  });

    if (!cliente) {
      console.error("Error creating cliente:");
      throw new Error("Error al crear el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error in createCliente:", error);
    throw error;
  }
}

export async function updateCliente(data: Partial<ClienteType>) {

  try {
    const cliente = await prisma.cliente.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,    
        cuit: data.cuit,
        email: data.email,
        telefono: data.telefono,
        domicilio: data.domicilio,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!cliente) {
      console.error("Error updating cliente:");
      throw new Error("Error al actualizar el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error in updateCliente:", error);
    throw error;
  }
}

export async function deleteCliente(id: string) {
  try {
    const cliente = await prisma.cliente.delete({
      where: {
        id: id,
      },
    });

    if (!cliente) {
      console.error("Error deleting cliente:");
      throw new Error("Error al eliminar el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteCliente:", error);
    throw error;
  }
}
