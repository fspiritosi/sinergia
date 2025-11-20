"use server";

import { Moneda, PropuestaStatus, PropuestaTecnica } from "@/generated/client";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CreatePropuestaInput {
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia: string | null;
  items: string[];
  contacto?: string;
  is_active?: boolean;
  valor: number;
  moneda: Moneda;
  status: PropuestaStatus;
}

export async function createPropuesta(data: CreatePropuestaInput) {
  try {
    await prisma.propuestaTecnica.create({
      data: {
        codigo: data.codigo,
        clienteId: data.clienteId,
        servicioId: data.servicioId,
        vigencia: data.vigencia ? new Date(data.vigencia) : null,
        items: data.items,
        contacto: data.contacto,
        is_active: data.is_active ?? true,
        valor: data.valor,
        moneda: data.moneda,
        status: data.status,
      },
    });

    revalidatePath("/dashboard/clientes/propuestas");
    return { success: true };
  } catch (error) {
    console.error("Error al crear la propuesta técnica:", error);
    throw error;
  }
}

export async function updatePropuesta(data: Partial<PropuestaTecnica>) {

  try {
    const propuesta = await prisma.propuestaTecnica.update({
      where: {
        id: data.id,
      },
      data: {
        codigo: data.codigo,
        vigencia: data.vigencia ?? null,
        items: data.items,
        contacto: data.contacto,
        is_active: data.is_active,
        valor: data.valor,
        moneda: data.moneda,
        status: data.status,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!propuesta) {
      console.error("Error updating propuesta:");
      throw new Error("Error al actualizar la propuesta");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error in updatePropuesta:", error);
    throw error;
  }
}

export async function deletePropuesta(id: string) {
  try {
    const propuesta = await prisma.propuestaTecnica.delete({
      where: {
        id: id,
      },
    });

    if (!propuesta) {
      console.error("Error deleting propuesta:");
      throw new Error("Error al eliminar la propuesta");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    console.error("Error in deletePropuesta:", error);
    throw error;
  }
}
