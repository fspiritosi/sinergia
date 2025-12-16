"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { uploadFileToR2 } from "@/lib/r2-upload";
import { refreshPlanTrabajoEstado } from "@/components/planesTrabajo/components/actions";

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

export type InformeCalendarItem = {
  id: string
  clienteId: string
  clienteNombre: string
  propuestaId: string
  propuestaCodigo: string
  tipoDeInformeId: string
  tipoDeInformeNombre: string
  fechaVencimiento: string
  estado: string
  adjunto: string | null
}

export async function getInformesByRange(params: {
  from: string
  to: string
}): Promise<InformeCalendarItem[]> {
  const from = new Date(params.from)
  const to = new Date(params.to)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Rango de fechas inválido")
  }

  const informes = await prisma.informe.findMany({
    where: {
      fechaVencimiento: {
        gte: from,
        lte: to,
      },
    },
    include: {
      cliente: { select: { id: true, name: true } },
      propuesta: { select: { id: true, codigo: true } },
      tipoDeInforme: { select: { id: true, name: true } },
    },
    orderBy: { fechaVencimiento: "asc" },
  })

  return informes.map((i) => ({
    id: i.id,
    clienteId: i.cliente.id,
    clienteNombre: i.cliente.name,
    propuestaId: i.propuesta.id,
    propuestaCodigo: i.propuesta.codigo,
    tipoDeInformeId: i.tipoDeInforme.id,
    tipoDeInformeNombre: i.tipoDeInforme.name,
    fechaVencimiento: i.fechaVencimiento.toISOString(),
    estado: String(i.estado),
    adjunto: i.adjunto ?? null,
  }))
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

  const updated = await prisma.informe.update({
    where: { id: informeId },
    data: {
      estado: "entregado",
      responsableConfeccion: responsable,
      adjunto: key,
    },
    select: {
      id: true,
      planTrabajoProgramacionId: true,
    },
  });

  if (updated.planTrabajoProgramacionId) {
    const programacion = await prisma.planTrabajoProgramacion.update({
      where: { id: updated.planTrabajoProgramacionId },
      data: {
        ejecutadoAt: new Date(),
      },
      select: {
        planTrabajoId: true,
      },
    });

    await refreshPlanTrabajoEstado(programacion.planTrabajoId);

    revalidatePath("/dashboard/planes");
    revalidatePath(`/dashboard/planes/${programacion.planTrabajoId}`);
  }

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
