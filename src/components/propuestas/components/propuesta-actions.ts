"use server";

import { Moneda, PropuestaStatus, PropuestaTecnica, Prisma } from "@/generated/client";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { parseDateOnlyToLocalNoon } from "@/lib/dates";
import { dbLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { nextCodigoNumero, formatCodigoPropuesta } from "@/lib/propuesta-codigo";

interface CreatePropuestaInput {
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

const MAX_CODIGO_RETRIES = 5;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Genera el siguiente código del año en curso (AÑO-NNN, arranca en 101) mirando
 * los códigos existentes con ese formato. Reintenta ante colisión por unicidad
 * (creación concurrente), usando el índice @unique como red de seguridad.
 */
export async function createPropuesta(data: CreatePropuestaInput) {
  await requirePermission(PERMISSIONS.PROPUESTAS_CREATE);

  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < MAX_CODIGO_RETRIES; attempt++) {
    const existentes = await prisma.propuestaTecnica.findMany({
      where: { codigo: { startsWith: `${year}-` } },
      select: { codigo: true },
    });

    const numero = nextCodigoNumero(
      existentes.map((p) => p.codigo),
      year
    );
    const codigo = formatCodigoPropuesta(year, numero);

    try {
      await prisma.propuestaTecnica.create({
        data: {
          codigo,
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
      return { success: true, codigo };
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_CODIGO_RETRIES - 1) {
        dbLogger.warn(
          { codigo, attempt },
          "Colisión de código de propuesta, reintentando con el siguiente número"
        );
        continue;
      }
      dbLogger.error({ error, codigo }, "Error al crear la propuesta técnica");
      throw error;
    }
  }

  throw new Error("No se pudo generar un código único para la propuesta. Intentá nuevamente.");
}

export async function updatePropuesta(data: Partial<PropuestaTecnica>) {
  await requirePermission(PERMISSIONS.PROPUESTAS_UPDATE);
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
        // codigo es inmutable: se genera al crear y no se modifica al editar
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
      },
    });

    if (!propuesta) {
      dbLogger.error(
        { propuestaId: data.id },
        "Error al actualizar propuesta: registro no actualizado"
      );
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
  await requirePermission(PERMISSIONS.PROPUESTAS_DELETE);
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
