"use server";

import { revalidatePath } from "next/cache";
import { Cliente as ClienteType } from "@/generated/client";
import { clienteRepository } from "@/repositories/cliente.repository";

export async function createCliente(data: ClienteType) {
  try {
    await clienteRepository.create({
      name: data.name,
      cuit: data.cuit,
      email: data.email,
      telefono: data.telefono,
      domicilio: data.domicilio,
      provinciaId: data.provinciaId,
      ciudadId: data.ciudadId,
      is_active: data.is_active,
    });

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    throw error;
  }
}

export async function updateCliente(data: Partial<ClienteType>) {
  try {
    if (!data.id) {
      throw new Error("ID is required for update");
    }

    await clienteRepository.update(data.id, {
      name: data.name,
      cuit: data.cuit,
      email: data.email,
      telefono: data.telefono,
      domicilio: data.domicilio,
      provinciaId: data.provinciaId,
      ciudadId: data.ciudadId,
      is_active: data.is_active,
    });

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    throw error;
  }
}

export async function deleteCliente(id: string) {
  try {
    await clienteRepository.delete(id);

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    throw error;
  }
}
