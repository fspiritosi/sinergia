"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { DetalleVariante } from "@/generated/client";
import { dbLogger } from "@/lib/logger";

const REVALIDATE_PATH = "/dashboard/detalles-variante";

export async function createDetalleVariante(data: DetalleVariante) {
  try {
    const record = await prisma.detalleVariante.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active ?? true,
        variantTypeId: data.variantTypeId,
      },
    });

    if (!record) {
      throw new Error("Error al crear el detalle de variante");
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, detalleVariante: data.name }, "Error al crear detalle de variante");
    throw error;
  }
}

export async function updateDetalleVariante(data: Partial<DetalleVariante>) {
  try {
    if (!data.id) {
      throw new Error("El identificador es requerido");
    }

    const updated = await prisma.detalleVariante.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
        ...(data.variantTypeId !== undefined ? { variantTypeId: data.variantTypeId } : {}),
        updatedAt: new Date().toISOString(),
      },
    });

    if (!updated) {
      throw new Error("Error al actualizar el detalle de variante");
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, detalleVarianteId: data.id }, "Error al actualizar detalle de variante");
    throw error;
  }
}

export async function deleteDetalleVariante(id: string) {
  try {
    if (!id) {
      throw new Error("El identificador es requerido");
    }

    const deleted = await prisma.detalleVariante.delete({
      where: { id },
    });

    if (!deleted) {
      throw new Error("Error al eliminar el detalle de variante");
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, detalleVarianteId: id }, "Error al eliminar detalle de variante");
    throw error;
  }
}

interface DetalleVarianteDetail {
  detalleVariante: DetalleVariante;
}

export async function getDetalleVariante(id: string): Promise<DetalleVarianteDetail> {
  try {
    const detalleVariante = await prisma.detalleVariante.findUnique({
      where: { id },
    });

    if (!detalleVariante) {
      throw new Error("Detalle de variante no encontrado");
    }

    return { detalleVariante };
  } catch (error) {
    dbLogger.error({ error, detalleVarianteId: id }, "Error al obtener detalle de variante");
    throw error;
  }
}
