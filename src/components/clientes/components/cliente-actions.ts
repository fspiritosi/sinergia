"use server";

import { revalidatePath } from "next/cache";
import { Cliente as ClienteType } from "@/generated/client";
import { clienteRepository } from "@/repositories/cliente.repository";
import { validateClienteCreate, validateClienteUpdate } from "@/lib/validations/cliente.schema";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function createCliente(data: ClienteType) {
  await requirePermission(PERMISSIONS.CLIENTES_CREATE);
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
  await requirePermission(PERMISSIONS.CLIENTES_UPDATE);
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
  await requirePermission(PERMISSIONS.CLIENTES_DELETE);
  try {
    await clienteRepository.delete(id);

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    throw error;
  }
}
