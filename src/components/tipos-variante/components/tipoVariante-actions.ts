"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { TipoDeVariante } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { mensajeEnUso, esErrorDeReferencia, type DeleteResult } from "@/lib/delete-guard";

export async function createTipoDeVariante(data: TipoDeVariante) {
  await requirePermission(PERMISSIONS.TIPOS_VARIANTE_CREATE);
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
  await requirePermission(PERMISSIONS.TIPOS_VARIANTE_UPDATE);
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

export async function deleteTipoDeVariante(id: string): Promise<DeleteResult> {
  await requirePermission(PERMISSIONS.TIPOS_VARIANTE_DELETE);
  try {
    if (!id) {
      return { success: false, error: "El identificador es requerido" };
    }

    const [detalles, items] = await Promise.all([
      prisma.detalleVariante.count({ where: { variantTypeId: id } }),
      // Items.variantTypeId es opcional (SET NULL): sin este chequeo el item
      // quedaría con hasVariant=true y sin tipo de variante.
      prisma.items.count({ where: { variantTypeId: id } }),
    ]);
    const enUso = mensajeEnUso("el tipo de variante", [
      { cantidad: detalles, singular: "detalle de variante", plural: "detalles de variante" },
      { cantidad: items, singular: "item", plural: "items" },
    ]);
    if (enUso) return { success: false, error: enUso };

    await prisma.tipoDeVariante.delete({ where: { id } });

    dbLogger.info({ tipoVarianteId: id }, "Tipo de variante eliminado");
    revalidatePath("/dashboard/tipos-variante");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoVarianteId: id }, "Error al eliminar tipo de variante");
    if (esErrorDeReferencia(error)) {
      return { success: false, error: "No se puede eliminar el tipo de variante: está en uso." };
    }
    return { success: false, error: "Error al eliminar el tipo de variante" };
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
