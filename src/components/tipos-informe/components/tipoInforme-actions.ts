"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TipoDeInforme } from "@/generated/client";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function createTipoDeInforme(data: TipoDeInforme) {
  await requirePermission(PERMISSIONS.TIPOS_INFORME_CREATE);
  try {
    const cliente: TipoDeInforme = await prisma.tipoDeInforme.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
      },
    });

    if (!cliente) {
      dbLogger.error(
        { tipoInformeName: data.name },
        "Error al crear tipo de informe: registro no creado"
      );
      throw new Error("Error al crear el servicio");
    }

    revalidatePath("/dashboard/servicios");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoInformeName: data.name }, "Error al crear tipo de informe");
    throw error;
  }
}

export async function updateTipoDeInforme(data: Partial<TipoDeInforme>) {
  await requirePermission(PERMISSIONS.TIPOS_INFORME_UPDATE);
  try {
    const tipoDeInforme = await prisma.tipoDeInforme.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        updatedAt: new Date().toISOString(),
      },
    });

    if (!tipoDeInforme) {
      dbLogger.error(
        { tipoInformeId: data.id },
        "Error al actualizar tipo de informe: registro no actualizado"
      );
      throw new Error("Error al actualizar el tipo de informe");
    }

    revalidatePath("/dashboard/tipos-informe");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoInformeId: data.id }, "Error al actualizar tipo de informe");
    throw error;
  }
}

export async function deleteTipoDeInforme(id: string) {
  await requirePermission(PERMISSIONS.TIPOS_INFORME_DELETE);
  try {
    const tipoDeInforme = await prisma.tipoDeInforme.delete({
      where: {
        id: id,
      },
    });

    if (!tipoDeInforme) {
      dbLogger.error(
        { tipoInformeId: id },
        "Error al eliminar tipo de informe: registro no eliminado"
      );
      throw new Error("Error al eliminar el tipo de informe");
    }

    revalidatePath("/dashboard/tipos-informe");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, tipoInformeId: id }, "Error al eliminar tipo de informe");
    throw error;
  }
}

interface TipoDeInformeDetail {
  tipoDeInforme: TipoDeInforme;
}

export async function getTipoDeInforme(id: string): Promise<TipoDeInformeDetail> {
  try {
    const tipoDeInforme = await prisma.tipoDeInforme.findUnique({
      where: {
        id,
      },
    });

    if (!tipoDeInforme) {
      dbLogger.error({ tipoInformeId: id }, "Tipo de Informe no encontrado");
      throw new Error("Tipo de Informe no encontrado");
    }

    return { tipoDeInforme };
  } catch (error) {
    dbLogger.error({ error, tipoInformeId: id }, "Error al obtener tipo de informe");
    throw error;
  }
}
