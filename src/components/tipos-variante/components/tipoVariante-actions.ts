"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TipoDeVariante } from "@/generated/client";
import { dbLogger } from "@/lib/logger";

export async function createTipoDeVariante(data: TipoDeVariante) {
  try {
    const record = await prisma.tipoDeVariante.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active ?? true,
      },
    });

    if (!record) {
      throw new Error("Error al crear el tipo de variante");
    }

    revalidatePath("/dashboard/tipos-variante");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoVarianteName: data.name }, "Error al crear tipo de variante");
    throw error;
  }
}

export async function updateTipoDeVariante(data: Partial<TipoDeVariante>) {
  try {
    if (!data.id) {
      throw new Error("El identificador es requerido");
    }

    const updated = await prisma.tipoDeVariante.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
        updatedAt: new Date().toISOString(),
      },
    });

    if (!updated) {
      throw new Error("Error al actualizar el tipo de variante");
    }

    revalidatePath("/dashboard/tipos-variante");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoVarianteId: data.id }, "Error al actualizar tipo de variante");
    throw error;
  }
}

export async function deleteTipoDeVariante(id: string) {
  try {
    if (!id) {
      throw new Error("El identificador es requerido");
    }

    const deleted = await prisma.tipoDeVariante.delete({
      where: { id },
    });

    if (!deleted) {
      throw new Error("Error al eliminar el tipo de variante");
    }

    revalidatePath("/dashboard/tipos-variante");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoVarianteId: id }, "Error al eliminar tipo de variante");
    throw error;
  }
}

interface TipoDeVarianteDetail {
  tipoDeVariante: TipoDeVariante;
}

export async function getTipoDeVariante(id: string): Promise<TipoDeVarianteDetail> {
  try {
    const tipoDeVariante = await prisma.tipoDeVariante.findUnique({
      where: { id },
    });

    if (!tipoDeVariante) {
      throw new Error("Tipo de variante no encontrado");
    }

    return { tipoDeVariante };
  } catch (error) {
    dbLogger.error({ error, tipoVarianteId: id }, "Error al obtener tipo de variante");
    throw error;
  }
}
