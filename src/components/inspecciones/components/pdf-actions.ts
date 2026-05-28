"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { pdfLogger } from "@/lib/logger";
import { formatDateOnly } from "@/lib/dates";
import { inspeccionRepository } from "@/repositories/inspeccion.repository";
import { getSeccionesConPreguntas } from "./actions";
import { InspeccionPDF, type SeccionPDF, type PreguntaPDF } from "../pdf/InspeccionPDF";

const R2_PUBLIC_BASE = "https://pub-f585ac1b3c1f462c8439adaf03fa21cd.r2.dev";

const TIPO_LABEL: Record<string, string> = {
  inspeccion_base: "Inspección de Base",
  inspeccion_equipo: "Inspección de Equipo",
};

type PreguntaNode = {
  id: string;
  codigo: string;
  texto: string;
  hijasCondicionales?: PreguntaNode[];
};

type SeccionNode = {
  codigo: string;
  titulo: string;
  hijas?: SeccionNode[];
  preguntas: PreguntaNode[];
};

/** Aplana una pregunta y sus hijas condicionales en una lista lineal. */
function flattenPreguntas(
  preguntas: PreguntaNode[]
): { id: string; codigo: string; texto: string }[] {
  const out: { id: string; codigo: string; texto: string }[] = [];
  for (const p of preguntas) {
    out.push({ id: p.id, codigo: p.codigo, texto: p.texto });
    for (const hija of p.hijasCondicionales ?? []) {
      out.push({ id: hija.id, codigo: hija.codigo, texto: hija.texto });
    }
  }
  return out;
}

export async function generateInspeccionPDF(inspeccionId: string) {
  await requirePermission(PERMISSIONS.INSPECCIONES_VIEW);

  try {
    const inspeccion = await inspeccionRepository.findByIdWithRespuestas(inspeccionId);
    if (!inspeccion) {
      throw new Error("Inspección no encontrada");
    }

    const seccionesData = (await getSeccionesConPreguntas()) as unknown as SeccionNode[];

    // Mapa preguntaId -> valor de respuesta
    const respuestasMap = new Map(inspeccion.respuestas.map((r) => [r.preguntaId, r]));

    // Aplanar secciones para la grilla de estado
    const secciones: SeccionPDF[] = [];
    for (const seccion of seccionesData) {
      if (seccion.hijas && seccion.hijas.length > 0) {
        for (const hija of seccion.hijas) {
          secciones.push({
            codigo: hija.codigo,
            titulo: hija.titulo,
            preguntas: flattenPreguntas(hija.preguntas).map<PreguntaPDF>((p) => ({
              codigo: p.codigo,
              texto: p.texto,
              valor: (respuestasMap.get(p.id)?.valor as "si" | "no" | "na" | undefined) ?? null,
            })),
          });
        }
      }
      if (seccion.preguntas && seccion.preguntas.length > 0) {
        secciones.push({
          codigo: seccion.codigo,
          titulo: seccion.titulo,
          preguntas: flattenPreguntas(seccion.preguntas).map<PreguntaPDF>((p) => ({
            codigo: p.codigo,
            texto: p.texto,
            valor: (respuestasMap.get(p.id)?.valor as "si" | "no" | "na" | undefined) ?? null,
          })),
        });
      }
    }

    // Detalle de hallazgos (respuestas NO)
    const detallesNo = inspeccion.respuestas
      .filter((r) => r.valor === "no")
      .map((r) => ({
        codigo: r.pregunta.codigo,
        texto: r.pregunta.texto,
        acciones: r.accionesSeleccionadas.map((a) => a.accion.texto),
        observaciones: r.observaciones,
        imagenesUrls: r.imagenes.map((img) => `${R2_PUBLIC_BASE}/${img.r2Key}`),
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

    const lugar = inspeccion.clientLocation?.name ?? inspeccion.lugarTexto ?? "—";

    const pdfBuffer = await renderToBuffer(
      InspeccionPDF({
        clienteNombre: inspeccion.cliente.name,
        fecha: formatDateOnly(inspeccion.fecha, "es-AR"),
        lugar,
        realizadoPor: inspeccion.realizadoPor.name ?? inspeccion.realizadoPor.email,
        tipo: TIPO_LABEL[inspeccion.tipo] ?? inspeccion.tipo,
        secciones,
        detallesNo,
      })
    );

    const base64 = pdfBuffer.toString("base64");
    const fechaArchivo = formatDateOnly(inspeccion.fecha, "es-AR").replace(/\//g, "-");

    return {
      success: true as const,
      data: base64,
      filename: `INSPECCION-${inspeccion.cliente.name}-${fechaArchivo}.pdf`,
    };
  } catch (error) {
    pdfLogger.error({ error, inspeccionId }, "Error al generar PDF de inspección");
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
