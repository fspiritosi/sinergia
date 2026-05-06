"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Items, Servicio } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function createItem(data: Items) {
  await requirePermission(PERMISSIONS.ITEMS_CREATE);
  try {
    const tipoDeInformeId =
      (data as any).tipoDeInformeId && (data as any).tipoDeInformeId !== ""
        ? (data as any).tipoDeInformeId
        : null;
    const esPlanificable = tipoDeInformeId !== null ? true : ((data as any).esPlanificable ?? true);
    const hasVariant = Boolean((data as any).hasVariant);
    const variantTypeId =
      hasVariant && (data as any).variantTypeId && (data as any).variantTypeId !== ""
        ? (data as any).variantTypeId
        : null;

    const cliente: Items = await prisma.items.create({
      data: {
        name: data.name,
        description: data.description,
        detail: (data as any).detail ?? "",
        is_active: data.is_active,
        tipoDeInformeId,
        esPlanificable,
        hasVariant,
        variantTypeId,
      },
    });

    if (!cliente) {
      dbLogger.error({ itemName: data.name }, "Error al crear item: registro no creado");
      throw new Error("Error al crear el item");
    }

    revalidatePath("/dashboard/items");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, itemName: data.name }, "Error al crear item");
    throw error;
  }
}

interface AssignItemsToServicioInput {
  servicioId: string;
  itemIds: string[];
}

export type ServicioAssignment = Pick<Servicio, "id" | "name" | "description" | "is_active">;

export async function getServiciosByItem(itemId: string): Promise<ServicioAssignment[]> {
  const servicios = await prisma.servicio.findMany({
    where: {
      itemsOnServicios: {
        some: {
          itemId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      is_active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return servicios;
}

export async function assignItemsToServicio({ servicioId, itemIds }: AssignItemsToServicioInput) {
  await requirePermission(PERMISSIONS.SERVICIOS_UPDATE);
  if (!servicioId) {
    throw new Error("El servicio es obligatorio para asignar items");
  }

  if (!itemIds?.length) {
    throw new Error("Debe seleccionar al menos un item para asignar");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingItems = await tx.itemsOnServicios.findMany({
        where: {
          servicioId,
        },
        select: {
          itemId: true,
        },
      });

      const existingItemIds = new Set(existingItems.map(({ itemId }) => itemId));
      const newItemIds = itemIds.filter((itemId) => !existingItemIds.has(itemId));

      if (!newItemIds.length) {
        return;
      }

      await tx.itemsOnServicios.createMany({
        data: newItemIds.map((itemId) => ({
          servicioId,
          itemId,
        })),
        skipDuplicates: true,
      });
    });

    revalidatePath("/dashboard/items");
    revalidatePath("/dashboard/servicios");

    return { success: true };
  } catch (error) {
    dbLogger.error({ error, servicioId, itemIds }, "Error al asignar items al servicio");
    throw error;
  }
}

export async function updateItem(data: Partial<Items>) {
  await requirePermission(PERMISSIONS.ITEMS_UPDATE);
  try {
    if (!data.id) {
      throw new Error("El identificador del item es requerido para actualizar");
    }

    let removedFromServicios = false;

    await prisma.$transaction(async (tx) => {
      const existingItem = await tx.items.findUnique({
        where: {
          id: data.id,
        },
        select: {
          is_active: true,
        },
      });

      if (!existingItem) {
        dbLogger.error({ itemId: data.id }, "Item no encontrado para actualizar");
        throw new Error("Item no encontrado");
      }

      const shouldDeactivate = existingItem.is_active && data.is_active === false;

      const tipoDeInformeId =
        (data as any).tipoDeInformeId && (data as any).tipoDeInformeId !== ""
          ? (data as any).tipoDeInformeId
          : null;
      const esPlanificable =
        tipoDeInformeId !== null
          ? true
          : (data as any).esPlanificable === undefined
            ? undefined
            : Boolean((data as any).esPlanificable);
      const hasVariant =
        (data as any).hasVariant === undefined ? undefined : Boolean((data as any).hasVariant);
      const variantTypeId =
        hasVariant === false
          ? null
          : (data as any).variantTypeId && (data as any).variantTypeId !== ""
            ? (data as any).variantTypeId
            : hasVariant === true
              ? null
              : undefined;

      await tx.items.update({
        where: {
          id: data.id,
        },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.detail !== undefined ? { detail: data.detail } : {}),
          ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
          ...(tipoDeInformeId !== undefined ? { tipoDeInformeId } : {}),
          ...(esPlanificable !== undefined ? { esPlanificable } : {}),
          ...(hasVariant !== undefined ? { hasVariant } : {}),
          ...(variantTypeId !== undefined ? { variantTypeId } : {}),
          updatedAt: new Date().toISOString(),
        },
      });

      if (shouldDeactivate) {
        await tx.itemsOnServicios.deleteMany({
          where: {
            itemId: data.id,
          },
        });
        removedFromServicios = true;
      }
    });

    revalidatePath("/dashboard/items");

    if (removedFromServicios) {
      revalidatePath("/dashboard/servicios");
    }

    return { success: true };
  } catch (error) {
    dbLogger.error({ error, itemId: data.id }, "Error al actualizar item");
    throw error;
  }
}

export async function deleteItem(id: string) {
  await requirePermission(PERMISSIONS.ITEMS_DELETE);
  try {
    const cliente = await prisma.items.delete({
      where: {
        id: id,
      },
    });

    if (!cliente) {
      dbLogger.error({ itemId: id }, "Error al eliminar item: registro no eliminado");
      throw new Error("Error al eliminar el item");
    }

    revalidatePath("/dashboard/items");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, itemId: id }, "Error al eliminar item");
    throw error;
  }
}
