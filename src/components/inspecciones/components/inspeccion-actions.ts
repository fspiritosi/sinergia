"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";

export async function crearInspeccion(data: {
  clienteId: string;
  tipo: "inspeccion_base" | "inspeccion_equipo";
  clientLocationId?: string | null;
  lugarTexto?: string | null;
  informeId?: string | null;
}) {
  const user = await requirePermission(PERMISSIONS.INSPECCIONES_CREATE);

  try {
    const inspeccion = await prisma.inspeccionFormulario.create({
      data: {
        clienteId: data.clienteId,
        tipo: data.tipo,
        realizadoPorId: user.id,
        clientLocationId: data.tipo === "inspeccion_base" ? (data.clientLocationId ?? null) : null,
        lugarTexto: data.tipo === "inspeccion_equipo" ? (data.lugarTexto ?? null) : null,
        informeId: data.informeId ?? null,
      },
    });

    revalidatePath("/dashboard/inspecciones");
    return { success: true, id: inspeccion.id };
  } catch (error) {
    dbLogger.error({ error }, "Error al crear inspección");
    throw error;
  }
}

export async function guardarRespuesta(data: {
  formularioId: string;
  preguntaId: string;
  valor: "si" | "no" | "na";
  observaciones?: string | null;
  accionIds?: string[];
}) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    const respuesta = await prisma.inspeccionRespuesta.upsert({
      where: {
        formularioId_preguntaId: {
          formularioId: data.formularioId,
          preguntaId: data.preguntaId,
        },
      },
      update: {
        valor: data.valor,
        observaciones: data.observaciones ?? null,
      },
      create: {
        formularioId: data.formularioId,
        preguntaId: data.preguntaId,
        valor: data.valor,
        observaciones: data.observaciones ?? null,
      },
    });

    // Sincronizar acciones correctivas
    await prisma.inspeccionAccionSeleccionada.deleteMany({
      where: { respuestaId: respuesta.id },
    });

    if (data.valor === "no" && data.accionIds?.length) {
      await prisma.inspeccionAccionSeleccionada.createMany({
        data: data.accionIds.map((accionId) => ({
          respuestaId: respuesta.id,
          accionId,
        })),
        skipDuplicates: true,
      });
    }

    // Actualizar updatedAt del formulario
    await prisma.inspeccionFormulario.update({
      where: { id: data.formularioId },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    dbLogger.error({ error, data }, "Error al guardar respuesta");
    throw error;
  }
}

export async function finalizarInspeccion(formularioId: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    await prisma.inspeccionFormulario.update({
      where: { id: formularioId },
      data: { estado: "completada" },
    });

    revalidatePath("/dashboard/inspecciones");
    revalidatePath(`/dashboard/inspecciones/${formularioId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, formularioId }, "Error al finalizar inspección");
    throw error;
  }
}

export async function eliminarInspeccion(id: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_DELETE);

  try {
    await prisma.inspeccionFormulario.delete({ where: { id } });
    revalidatePath("/dashboard/inspecciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, id }, "Error al eliminar inspección");
    throw error;
  }
}
