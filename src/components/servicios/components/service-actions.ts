"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Items, Servicio as ServicioType } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function createServicio(data: ServicioType) {
  await requirePermission(PERMISSIONS.SERVICIOS_CREATE);
  try {
    const cliente: ServicioType = await prisma.servicio.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        is_active: data.is_active,
      },
    });

    if (!cliente) {
      dbLogger.error({ serviceName: data.name }, "Error al crear servicio: registro no creado");
      throw new Error("Error al crear el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, serviceName: data.name }, "Error al crear servicio");
    throw error;
  }
}

export async function updateServicio(data: Partial<ServicioType>) {
  await requirePermission(PERMISSIONS.SERVICIOS_UPDATE);
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
      },
    });

    if (!cliente) {
      dbLogger.error(
        { servicioId: data.id },
        "Error al actualizar servicio: registro no actualizado"
      );
      throw new Error("Error al actualizar el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, servicioId: data.id }, "Error al actualizar servicio");
    throw error;
  }
}

export async function deleteServicio(id: string) {
  await requirePermission(PERMISSIONS.SERVICIOS_DELETE);
  try {
    const cliente = await prisma.servicio.delete({
      where: {
        id: id,
      },
    });

    if (!cliente) {
      dbLogger.error({ servicioId: id }, "Error al eliminar servicio: registro no eliminado");
      throw new Error("Error al eliminar el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, servicioId: id }, "Error al eliminar servicio");
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
      dbLogger.error({ servicioId: id }, "Servicio no encontrado");
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
    dbLogger.error({ error, servicioId: id }, "Error al obtener items del servicio");
    throw error;
  }
}

interface UpdateServicioItemsInput {
  servicioId: string;
  itemIds: string[];
}

export async function updateServicioItems({ servicioId, itemIds }: UpdateServicioItemsInput) {
  await requirePermission(PERMISSIONS.SERVICIOS_UPDATE);
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
    dbLogger.error({ error, servicioId }, "Error al actualizar los items del servicio");
    throw error;
  }
}
