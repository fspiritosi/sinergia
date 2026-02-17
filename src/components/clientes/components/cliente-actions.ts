"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Cliente as ClienteType } from "@/generated/client";
import { dbLogger } from "@/lib/logger";

export async function createCliente(data: ClienteType) {
  try {
    const cliente: ClienteType = await prisma.cliente.create({
      data: {
        name: data.name,
        cuit: data.cuit,  
        email: data.email,
        telefono: data.telefono,
        domicilio: data.domicilio,
        provinciaId: data.provinciaId,
        ciudadId: data.ciudadId,
        is_active: data.is_active,
    }
  });

    if (!cliente) {
      dbLogger.error({ clienteName: data.name }, "Error al crear cliente: registro no creado");
      throw new Error("Error al crear el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, clienteName: data.name }, "Error al crear cliente");
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
        provinciaId: data.provinciaId,
        ciudadId: data.ciudadId,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!cliente) {
      dbLogger.error({ clienteId: data.id }, "Error al actualizar cliente: registro no actualizado");
      throw new Error("Error al actualizar el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, clienteId: data.id }, "Error al actualizar cliente");
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
      dbLogger.error({ clienteId: id }, "Error al eliminar cliente: registro no eliminado");
      throw new Error("Error al eliminar el cliente");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, clienteId: id }, "Error al eliminar cliente");
    throw error;
  }
}
