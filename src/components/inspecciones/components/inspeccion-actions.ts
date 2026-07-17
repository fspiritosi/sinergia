"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS, ROLES } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";
import { uploadFileToR2, deleteFileFromR2 } from "@/lib/r2-upload";
import { parseDateOnlyToLocalNoon } from "@/lib/dates";
import { assertInspeccionEliminable } from "./inspeccion-guards";

export async function crearInspeccion(data: {
  clienteId: string;
  tipo: "inspeccion_base" | "inspeccion_equipo";
  clientLocationId?: string | null;
  lugarTexto?: string | null;
  informeId?: string | null;
  fechaInspeccion?: string | null;
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
        fechaInspeccion: data.fechaInspeccion
          ? parseDateOnlyToLocalNoon(data.fechaInspeccion)
          : null,
      },
    });

    revalidatePath("/dashboard/inspecciones");
    return { success: true, id: inspeccion.id };
  } catch (error) {
    dbLogger.error({ error }, "Error al crear inspección");
    throw error;
  }
}

export async function actualizarFechaInspeccion(formularioId: string, fecha: string | null) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    await prisma.inspeccionFormulario.update({
      where: { id: formularioId },
      data: {
        fechaInspeccion: fecha ? parseDateOnlyToLocalNoon(fecha) : null,
      },
    });

    revalidatePath("/dashboard/inspecciones");
    revalidatePath(`/dashboard/inspecciones/${formularioId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, formularioId }, "Error al actualizar la fecha de inspección");
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
const MAX_FILE_SIZE_MB = 15;

export async function uploadImagenRespuesta(formData: FormData) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  const formularioId = formData.get("formularioId") as string;
  const preguntaId = formData.get("preguntaId") as string;
  const file = formData.get("file") as File | null;

  if (!formularioId || !preguntaId || !file) {
    throw new Error("Faltan datos para subir la imagen");
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`La imagen supera el tamaño máximo de ${MAX_FILE_SIZE_MB} MB`);
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

const MAX_FIRMA_SIZE_MB = 5;

export async function uploadFirmaInspeccion(formData: FormData) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  const formularioId = formData.get("formularioId") as string;
  const file = formData.get("file") as File | null;

  if (!formularioId || !file) {
    throw new Error("Faltan datos para subir la firma");
  }

  if (file.size > MAX_FIRMA_SIZE_MB * 1024 * 1024) {
    throw new Error(`La firma supera el tamaño máximo de ${MAX_FIRMA_SIZE_MB} MB`);
  }

  try {
    // Key estable por inspección: re-subir una firma sobrescribe la anterior.
    const key = `inspecciones/${formularioId}/firma`;

    await uploadFileToR2(file, key);

    await prisma.inspeccionFormulario.update({
      where: { id: formularioId },
      data: { firmaR2Key: key },
    });

    revalidatePath(`/dashboard/inspecciones/${formularioId}`);
    return { success: true, r2Key: key };
  } catch (error) {
    dbLogger.error({ error, formularioId }, "Error al subir la firma");
    throw error;
  }
}

export async function deleteFirmaInspeccion(formularioId: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_UPDATE);

  try {
    const inspeccion = await prisma.inspeccionFormulario.findUnique({
      where: { id: formularioId },
      select: { firmaR2Key: true },
    });

    if (!inspeccion) throw new Error("Inspección no encontrada");

    if (inspeccion.firmaR2Key) {
      await deleteFileFromR2(inspeccion.firmaR2Key);
    }

    await prisma.inspeccionFormulario.update({
      where: { id: formularioId },
      data: { firmaR2Key: null },
    });

    revalidatePath(`/dashboard/inspecciones/${formularioId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, formularioId }, "Error al eliminar la firma");
    throw error;
  }
}

export async function eliminarInspeccion(id: string) {
  const user = await requirePermission(PERMISSIONS.INSPECCIONES_DELETE);

  const existing = await prisma.inspeccionFormulario.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!existing) {
    throw new Error("Inspección no encontrada");
  }

  // Los informes finalizados solo puede eliminarlos un administrador.
  assertInspeccionEliminable(existing, { isAdmin: user.role.name === ROLES.ADMIN });

  try {
    await prisma.inspeccionFormulario.delete({ where: { id } });
    revalidatePath("/dashboard/inspecciones");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, id }, "Error al eliminar inspección");
    throw error;
  }
}
