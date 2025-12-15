"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/r2-upload";

export async function getInformes() {
  const informes = await prisma.informe.findMany({
    include: {
      cliente: true,
      tipoDeInforme: true,
      clientLocation: true,
      propuesta: true,
    },
  });

  if (!informes) return [];

  const ordenados = informes.sort((a, b) => {
    if (a.estado === "pendiente" && b.estado !== "pendiente") return -1;
    if (a.estado !== "pendiente" && b.estado === "pendiente") return 1;
    return a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime();
  });

  return ordenados;
}

export async function getPendingInformes() {
  const informes = await prisma.informe.findMany({
    where: {
      estado: "pendiente",
    },
    include: {
      cliente: true,
      tipoDeInforme: true,
      clientLocation: true,
    },
  });

  if (!informes) return [];

  return informes;
}

export async function createInforme(data: any) {
  const informe = await prisma.informe.create({
    data,
  });

  revalidatePath("/dashboard/informes");
  return informe;
}

export async function completarInforme(formData: FormData) {
  const file = formData.get("file") as File | null;
  const informeId = formData.get("informeId") as string | null;
  const responsable = formData.get("responsable") as string | null;

  if (!file || !informeId || !responsable) {
    throw new Error("Faltan datos requeridos");
  }

  const key = `informes/${informeId}`;
  await uploadFileToR2(file, key);

  await prisma.informe.update({
    where: { id: informeId },
    data: {
      estado: "entregado",
      responsableConfeccion: responsable,
      adjunto: key,
    },
  });

  revalidatePath("/dashboard/informes");
}

export async function updateInforme(id: string, data: any) {
  const informe = await prisma.informe.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/informes");
  return informe;
}

interface GenerateInformesInput {
  propuestaId: string;
  fechaVencimiento: string;
  clientLocationId: string;
}

export async function generateInformesFromPropuesta({
  propuestaId,
  fechaVencimiento,
  clientLocationId,
}: GenerateInformesInput) {
  const propuesta = await prisma.propuestaTecnica.findUnique({
    where: { id: propuestaId },
    include: {
      servicios: true,
    },
  });

  if (!propuesta) {
    throw new Error("Propuesta no encontrada");
  }

  if (propuesta.servicios.type !== "unitario") {
    return { success: false, reason: "Servicio no es unitario" };
  }

  const existingCount = await prisma.informe.count({
    where: { propuestaId },
  });

  if (existingCount > 0) {
    return {
      success: false,
      reason: "Los informes ya fueron generados para esta propuesta",
    };
  }

  const fecha = new Date(fechaVencimiento);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error("Fecha de realización inválida");
  }

  const items = await prisma.items.findMany({
    where: {
      id: { in: propuesta.items },
      tipoDeInformeId: { not: null },
    },
  });

  if (!items.length) {
    return {
      success: false,
      reason: "No hay items con tipo de informe asociado",
    };
  }

  await prisma.informe.createMany({
    data: items.map((item) => ({
      clienteId: propuesta.clienteId,
      tipoDeInformeId: item.tipoDeInformeId!,
      propuestaId,
      clientLocationId,
      fechaVencimiento: fecha,
      responsableConfeccion: "",
    })),
  });

  revalidatePath("/dashboard/informes");
  return { success: true, createdCount: items.length };
}

export type Informe = Awaited<ReturnType<typeof getInformes>>[0];
