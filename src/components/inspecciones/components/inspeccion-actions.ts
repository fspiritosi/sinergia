"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/r2-upload";

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

const MAX_IMAGENES_POR_RESPUESTA = 3;

export async function uploadImagenRespuesta(formData: FormData) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  const formularioId = formData.get("formularioId") as string;
  const preguntaId = formData.get("preguntaId") as string;
  const file = formData.get("file") as File | null;

  if (!formularioId || !preguntaId || !file) {
    throw new Error("Faltan datos para subir la imagen");
  }

  try {
    // Asegurar que existe la respuesta (upsert con valor actual o "na" por defecto)
    const respuesta = await prisma.inspeccionRespuesta.upsert({
      where: {
        formularioId_preguntaId: { formularioId, preguntaId },
      },
      update: {},
      create: {
        formularioId,
        preguntaId,
        valor: "na",
      },
      include: { imagenes: true },
    });

    if (respuesta.imagenes.length >= MAX_IMAGENES_POR_RESPUESTA) {
      throw new Error(`Máximo ${MAX_IMAGENES_POR_RESPUESTA} imágenes por respuesta`);
    }

    const orden = respuesta.imagenes.length + 1;
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `inspecciones/${formularioId}/${preguntaId}/${orden}.${ext}`;

    await uploadFileToR2(file, key);

    const imagen = await prisma.inspeccionRespuestaImagen.create({
      data: {
        respuestaId: respuesta.id,
        r2Key: key,
        orden,
      },
    });

    return { success: true, id: imagen.id, r2Key: key };
  } catch (error) {
    dbLogger.error({ error, formularioId, preguntaId }, "Error al subir imagen");
    throw error;
  }
}

export async function deleteImagenRespuesta(imagenId: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    const imagen = await prisma.inspeccionRespuestaImagen.findUnique({
      where: { id: imagenId },
    });

    if (!imagen) throw new Error("Imagen no encontrada");

    await deleteFileFromR2(imagen.r2Key);

    await prisma.inspeccionRespuestaImagen.delete({
      where: { id: imagenId },
    });

    return { success: true };
  } catch (error) {
    dbLogger.error({ error, imagenId }, "Error al eliminar imagen");
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
