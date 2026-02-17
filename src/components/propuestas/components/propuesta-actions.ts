"use server";

import { Moneda, PropuestaStatus, PropuestaTecnica } from "@/generated/client";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseDateOnlyToLocalNoon } from "@/lib/dates";
import { dbLogger } from "@/lib/logger";

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
  condicionesParticulares: string[];
}

export async function createPropuesta(data: CreatePropuestaInput) {
  try {
    await prisma.propuestaTecnica.create({
      data: {
        codigo: data.codigo,
        clienteId: data.clienteId,
        servicioId: data.servicioId,
        vigencia: data.vigencia ? parseDateOnlyToLocalNoon(data.vigencia) : null,
        items: data.items,
        contacto: data.contacto,
        is_active: data.is_active ?? true,
        valor: data.valor,
        moneda: data.moneda,
        status: data.status,
        condicionesParticulares: data.condicionesParticulares,
      },
    });

    revalidatePath("/dashboard/clientes/propuestas");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, propuestaCodigo: data.codigo }, "Error al crear la propuesta técnica");
    throw error;
  }
}

export async function updatePropuesta(data: Partial<PropuestaTecnica>) {

  try {
    const vigencia =
      data.vigencia instanceof Date
        ? data.vigencia
        : data.vigencia
          ? parseDateOnlyToLocalNoon(data.vigencia)
          : null;

    const propuesta = await prisma.propuestaTecnica.update({
      where: {
        id: data.id,
      },
      data: {
        codigo: data.codigo,
        clienteId: data.clienteId,
        servicioId: data.servicioId,
        vigencia,
        items: data.items,
        contacto: data.contacto,
        is_active: data.is_active,
        valor: data.valor,
        moneda: data.moneda,
        status: data.status,
        condicionesParticulares: data.condicionesParticulares,
        updatedAt: new Date().toISOString(),
      }
    });

    if (!propuesta) {
      dbLogger.error({ propuestaId: data.id }, "Error al actualizar propuesta: registro no actualizado");
      throw new Error("Error al actualizar la propuesta");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, propuestaId: data.id }, "Error al actualizar propuesta");
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
      dbLogger.error({ propuestaId: id }, "Error al eliminar propuesta: registro no eliminado");
      throw new Error("Error al eliminar la propuesta");
    }

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, propuestaId: id }, "Error al eliminar propuesta");
    throw error;
  }
}
