"use server";

import prisma from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlanTrabajoPDF } from "../pdf/PlanTrabajoPDF";
import type { MonthGroup, ProgramacionRow } from "../pdf/ProgramacionesPage";
import { formatDateOnly } from "@/lib/dates";
import { pdfLogger } from "@/lib/logger";

function formatEstado(estado: string): string {
  switch (estado) {
    case "pendiente_programacion":
      return "Pendiente de Programación";
    case "programado_incompleto":
      return "Programado incompleto";
    case "programado_completo":
      return "Programado completo";
    case "en_desarrollo":
      return "En desarrollo";
    case "finalizado_con_pendientes":
      return "Finalizado con pendientes";
    case "finalizado_completo":
      return "Finalizado completo";
    default:
      return estado;
  }
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function groupProgramacionesByMonth(
  programaciones: {
    item: { name: string };
    detalleVariante: { name: string } | null;
    fechaProgramada: Date;
    precision: string;
    clientLocation: { name: string } | null;
    ejecutadoAt: Date | null;
    informe: { estado: string } | null;
  }[]
): MonthGroup[] {
  const groups = new Map<string, { label: string; rows: ProgramacionRow[] }>();

  for (const prog of programaciones) {
    const date = new Date(prog.fechaProgramada);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!groups.has(key)) {
      groups.set(key, {
        label: formatMonthLabel(date),
        rows: [],
      });
    }

    const itemName = prog.detalleVariante
      ? `${prog.item.name} - ${prog.detalleVariante.name}`
      : prog.item.name;

    const ejecutado = Boolean(prog.ejecutadoAt) || prog.informe?.estado === "entregado";

    groups.get(key)!.rows.push({
      itemName,
      fechaProgramada:
        prog.precision === "mes"
          ? date.toLocaleDateString("es-AR", {
              month: "long",
              year: "numeric",
            })
          : formatDateOnly(date, "es-AR"),
      ubicacion: prog.clientLocation?.name ?? "-",
      ejecutado,
      fechaEjecucion: prog.ejecutadoAt ? formatDateOnly(prog.ejecutadoAt, "es-AR") : "-",
    });
  }

  // Sort by key (YYYY-MM) and return as array
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, group]) => ({
      monthLabel: group.label,
      rows: group.rows,
    }));
}

export async function generatePlanTrabajoPDF(planTrabajoId: string) {
  try {
    const plan = await prisma.planTrabajo.findUnique({
      where: { id: planTrabajoId },
      include: {
        cliente: { select: { name: true } },
        propuesta: {
          select: {
            codigo: true,
            servicios: { select: { name: true, description: true } },
          },
        },
        programaciones: {
          include: {
            item: { select: { name: true } },
            detalleVariante: { select: { name: true } },
            clientLocation: { select: { name: true } },
            informe: { select: { estado: true } },
          },
          orderBy: { fechaProgramada: "asc" },
        },
      },
    });

    if (!plan) {
      throw new Error("Plan de trabajo no encontrado");
    }

    // Compute stats
    const total = plan.programaciones.length;
    const completadas = plan.programaciones.filter(
      (p) => Boolean(p.ejecutadoAt) || p.informe?.estado === "entregado"
    ).length;
    const pendientes = total - completadas;
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

    // Group programaciones by month
    const monthGroups = groupProgramacionesByMonth(plan.programaciones);

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      PlanTrabajoPDF({
        clienteNombre: plan.cliente.name,
        propuestaCodigo: plan.propuesta.codigo,
        servicioNombre: plan.propuesta.servicios.name,
        servicioDescripcion: plan.propuesta.servicios.description,
        fechaInicio: formatDateOnly(plan.fechaInicio, "es-AR"),
        fechaFin: formatDateOnly(plan.fechaFin, "es-AR"),
        estado: formatEstado(plan.estado),
        totalProgramaciones: total,
        completadas,
        pendientes,
        porcentajeCompletado: porcentaje,
        monthGroups,
      })
    );

    const base64 = pdfBuffer.toString("base64");

    return {
      success: true as const,
      data: base64,
      filename: `PLAN-TRABAJO-${plan.propuesta.codigo}.pdf`,
    };
  } catch (error) {
    pdfLogger.error({ error, planTrabajoId }, "Error al generar PDF de plan de trabajo");
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
