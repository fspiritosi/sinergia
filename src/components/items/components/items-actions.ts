"use server";


import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Items } from "@/generated/client";




export async function createItem(data: Items) {
  try {
    const cliente: Items = await prisma.items.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
    }
  });

    if (!cliente) {
      console.error("Error creating item:");
      throw new Error("Error al crear el item");
    }

    revalidatePath("/dashboard/items");
    return { success: true };
  } catch (error) {
    console.error("Error in createItem:", error);
    throw error;
  }
}

interface AssignItemsToServicioInput {
  servicioId: string;
  itemIds: string[];
}

export async function assignItemsToServicio({
  servicioId,
  itemIds,
}: AssignItemsToServicioInput) {
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
    console.error("Error al asignar items al servicio:", error);
    throw error;
  }
}

export async function updateItem(data: Partial<Items>) {

  try {
    const cliente = await prisma.items.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,    
        description: data.description,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!cliente) {
      console.error("Error updating item");
      throw new Error("Error al actualizar el item");
    }

    revalidatePath("/dashboard/items");
    return { success: true };
  } catch (error) {
    console.error("Error in updateItem:", error);
    throw error;
  }
}

export async function deleteItem(id: string) {
  try {
    const cliente = await prisma.items.delete({
      where: {
        id: id,
      },
    });

    if (!cliente) {
      console.error("Error deleting item:");
      throw new Error("Error al eliminar el item");
    }

    revalidatePath("/dashboard/items");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteItem:", error);
    throw error;
  }
}


