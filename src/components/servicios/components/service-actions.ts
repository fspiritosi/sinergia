"use server";


import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Items, Servicio as ServicioType } from "@/generated/client"




export async function createServicio(data: ServicioType) {
  try {
    const cliente: ServicioType = await prisma.servicio.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        is_active: data.is_active,
    }
  });

    if (!cliente) {
      console.error("Error creating servicio:");
      throw new Error("Error al crear el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error in createServicio:", error);
    throw error;
  }
}

export async function updateServicio(data: Partial<ServicioType>) {

  try {
    const cliente = await prisma.servicio.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,    
        description: data.description,
        type: data.type,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!cliente) {
      console.error("Error updating servicio:");
      throw new Error("Error al actualizar el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error in updateServicio:", error);
    throw error;
  }
}

export async function deleteServicio(id: string) {
  try {
    const cliente = await prisma.servicio.delete({
      where: {
        id: id,
      },
    });

    if (!cliente) {
      console.error("Error deleting servicio:");
      throw new Error("Error al eliminar el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteServicio:", error);
    throw error;
  }
}

interface ServicioDetail {
    servicio: ServicioType;
    items: Items[];
}

export async function getItemsService(id: string): Promise<ServicioDetail> {
    try {
        const servicio = await prisma.servicio.findUnique({
            where: {
                id,
            },
        });

        if (!servicio) {
            console.error("Servicio no encontrado:", id);
            throw new Error("Servicio no encontrado");
        }

        const itemsOnServicio = await prisma.itemsOnServicios.findMany({
            where: {
                servicioId: id,
            },
            include: {
                item: true,
            },
        });

        const items = itemsOnServicio
            .map(({ item }) => item)
            .filter((item): item is Items => Boolean(item));

        return { servicio, items };
    } catch (error) {
        console.error("Error al obtener items del servicio:", error);
        throw error;
    }
}

interface UpdateServicioItemsInput {
  servicioId: string;
  itemIds: string[];
}

export async function updateServicioItems({ servicioId, itemIds }: UpdateServicioItemsInput) {
  try {
    await prisma.$transaction([
      prisma.itemsOnServicios.deleteMany({
        where: {
          servicioId,
        },
      }),
      ...(itemIds.length
        ? [
          prisma.itemsOnServicios.createMany({
            data: itemIds.map((itemId) => ({
              servicioId,
              itemId,
            })),
            skipDuplicates: true,
          }),
        ]
        : []),
    ]);

    revalidatePath("/dashboard/servicios");
    revalidatePath("/dashboard/items");

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar los items del servicio:", error);
    throw error;
  }
}