"use server";


import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TipoDeInforme } from "@/generated/client"




export async function createTipoDeInforme(data: TipoDeInforme) {
  try {
    const cliente: TipoDeInforme = await prisma.tipoDeInforme.create({
      data: {
        name: data.name,
        description: data.description,
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

export async function updateTipoDeInforme(data: Partial<TipoDeInforme>) {

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
      }
    });

    if (!tipoDeInforme) {
      console.error("Error updating tipo de informe:");
      throw new Error("Error al actualizar el tipo de informe");
    }

    revalidatePath("/dashboard/tipos-informe");
    return { success: true };
  } catch (error) {
    console.error("Error in updateTipoDeInforme:", error);
    throw error;
  }
}

export async function deleteTipoDeInforme(id: string) {
  try {
    const tipoDeInforme = await prisma.tipoDeInforme.delete({
      where: {
        id: id,
      },
    });

    if (!tipoDeInforme) {
      console.error("Error deleting Tipo de Informe:");
      throw new Error("Error al eliminar el tipo de informe");
    }

    revalidatePath("/dashboard/tipos-informe");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteTipoDeInforme:", error);
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
            console.error("Tipo de Informe no encontrado:", id);
            throw new Error("Tipo de Informe no encontrado");
        }

        
        return { tipoDeInforme };
    } catch (error) {
        console.error("Error al obtener tipo de informe:", error);
        throw error;
    }
}



