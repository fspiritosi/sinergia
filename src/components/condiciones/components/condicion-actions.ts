"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Condicion } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { DeleteResult } from "@/lib/delete-guard";

export async function createCondicion(data: Partial<Condicion>) {
  await requirePermission(PERMISSIONS.CONDICIONES_CREATE);
  try {
    const condicion = await prisma.condicion.create({
      data: {
        title: data.title!,
        description: data.description!,
        tipo: data.tipo!,
        category: data.category,
        order: data.order ?? 0,
        is_active: data.is_active ?? true,
      },
    });

    if (!condicion) {
      dbLogger.error(
        { condicionTitle: data.title },
        "Error al crear condición: registro no creado"
      );
      throw new Error("Error al crear la condición");
    }

    revalidatePath("/dashboard/condiciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, condicionTitle: data.title }, "Error al crear condición");
    throw error;
  }
}

export async function updateCondicion(data: Partial<Condicion>) {
  await requirePermission(PERMISSIONS.CONDICIONES_UPDATE);
  try {
    const condicion = await prisma.condicion.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        tipo: data.tipo,
        category: data.category,
        order: data.order,
        is_active: data.is_active,
        updatedAt: new Date(),
      },
    });

    if (!condicion) {
      dbLogger.error(
        { condicionId: data.id },
        "Error al actualizar condición: registro no actualizado"
      );
      throw new Error("Error al actualizar la condición");
    }

    revalidatePath("/dashboard/condiciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, condicionId: data.id }, "Error al actualizar condición");
    throw error;
  }
}

export async function deleteCondicion(id: string): Promise<DeleteResult> {
  await requirePermission(PERMISSIONS.CONDICIONES_DELETE);
  try {
    // Sin FK: las propuestas guardan una copia del texto de la condición.
    await prisma.condicion.delete({ where: { id } });

    dbLogger.info({ condicionId: id }, "Condición eliminada");
    revalidatePath("/dashboard/condiciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, condicionId: id }, "Error al eliminar condición");
    return { success: false, error: "Error al eliminar la condición" };
  }
}

interface CondicionDetail {
  condicion: Condicion;
}

export async function getCondicion(id: string): Promise<CondicionDetail> {
  try {
    const condicion = await prisma.condicion.findUnique({
      where: {
        id,
      },
    });

    if (!condicion) {
      dbLogger.error({ condicionId: id }, "Condición no encontrada");
      throw new Error("Condición no encontrada");
    }

    return { condicion };
  } catch (error) {
    dbLogger.error({ error, condicionId: id }, "Error al obtener condición");
    throw error;
  }
}
