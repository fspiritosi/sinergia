"use server";

import { revalidatePath } from "next/cache";
import { Cliente as ClienteType } from "@/generated/client";
import { clienteRepository } from "@/repositories/cliente.repository";
import { validateClienteCreate, validateClienteUpdate } from "@/lib/validations/cliente.schema";
import { dbLogger } from "@/lib/logger";

export async function createCliente(data: ClienteType) {
  try {
    // Validate input data with Zod schema
    const validatedData = validateClienteCreate({
      name: data.name,
      cuit: data.cuit,
      email: data.email,
      telefono: data.telefono,
      domicilio: data.domicilio,
      provinciaId: data.provinciaId,
      ciudadId: data.ciudadId,
      is_active: data.is_active,
    });

    await clienteRepository.create(validatedData as any);

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    // Log validation errors for debugging
    if (error instanceof Error && error.name === "ZodError") {
      dbLogger.error({ error, data }, "Validation error in createCliente");
    }
    throw error;
  }
}

export async function updateCliente(data: Partial<ClienteType>) {
  try {
    if (!data.id) {
      throw new Error("ID is required for update");
    }

    // Validate input data with Zod schema
    const validatedData = validateClienteUpdate({
      id: data.id,
      name: data.name,
      cuit: data.cuit,
      email: data.email,
      telefono: data.telefono,
      domicilio: data.domicilio,
      provinciaId: data.provinciaId,
      ciudadId: data.ciudadId,
      is_active: data.is_active,
    });

    await clienteRepository.update(validatedData.id, validatedData as any);

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    // Log validation errors for debugging
    if (error instanceof Error && error.name === "ZodError") {
      dbLogger.error({ error, data }, "Validation error in updateCliente");
    }
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
