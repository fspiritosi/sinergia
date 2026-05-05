"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Condicion } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

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

export async function deleteCondicion(id: string) {
  await requirePermission(PERMISSIONS.CONDICIONES_DELETE);
  try {
    const condicion = await prisma.condicion.delete({
      where: {
        id: id,
      },
    });

    if (!condicion) {
      dbLogger.error({ condicionId: id }, "Error al eliminar condición: registro no eliminado");
      throw new Error("Error al eliminar la condición");
    }

    revalidatePath("/dashboard/condiciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, condicionId: id }, "Error al eliminar condición");
    throw error;
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
