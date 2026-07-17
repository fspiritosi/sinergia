"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, AlertCircle, FileDown } from "lucide-react";
import { formatDateOnly } from "@/lib/dates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getSeccionesConPreguntas, getInspeccionById } from "./actions";
import {
  guardarRespuesta,
  finalizarInspeccion,
  actualizarFechaInspeccion,
} from "./inspeccion-actions";
import { generateInspeccionPDF } from "./pdf-actions";
import { FirmaCapture } from "./firma-capture";
import { InspeccionSeccion, type SeccionData } from "./inspeccion-seccion";
import type { RespuestaLocal, PreguntaData } from "./inspeccion-pregunta";

/** Convierte una fecha (Date o string ISO) al formato YYYY-MM-DD en hora local. */
function dateToInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type Props = {
  inspeccionId: string;
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: "Borrador",
  completada: "Completada",
};

const TIPO_LABELS: Record<string, string> = {
  inspeccion_base: "Inspeccion Base",
  inspeccion_equipo: "Inspeccion Equipo",
};

/**
 * Collect all "visible" question IDs: root questions + conditional children
 * where the parent was answered "si".
 */
function collectVisiblePreguntaIds(
  preguntas: PreguntaData[],
  respuestas: Map<string, RespuestaLocal>
): string[] {
  const ids: string[] = [];
  for (const p of preguntas) {
    ids.push(p.id);
    const r = respuestas.get(p.id);
    if (r?.valor === "si" && (p.hijasCondicionales?.length ?? 0) > 0) {
      ids.push(...collectVisiblePreguntaIds(p.hijasCondicionales!, respuestas));
    }
  }
  return ids;
}

function collectAllPreguntas(secciones: SeccionData[]): PreguntaData[] {
  const preguntas: PreguntaData[] = [];
  for (const seccion of secciones) {
    preguntas.push(...seccion.preguntas);
    preguntas.push(...collectAllPreguntas(seccion.hijas ?? []));
  }
  return preguntas;
}

export function InspeccionForm({ inspeccionId }: Props) {
  const queryClient = useQueryClient();
  const [respuestas, setRespuestas] = useState<Map<string, RespuestaLocal>>(new Map());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [hasSaved, setHasSaved] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [fechaInspeccionValue, setFechaInspeccionValue] = useState("");
  const [hasFirma, setHasFirma] = useState(false);
  const initializedRef = useRef(false);
  const datosInitRef = useRef(false);

  const handleDownloadPDF = useCallback(async () => {
    setDownloadingPdf(true);
    try {
      const result = await generateInspeccionPDF(inspeccionId);
      if (!result.success || !result.data) {
        toast.error(result.success ? "Error al generar PDF" : result.error);
        return;
      }

      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setDownloadingPdf(false);
    }
  }, [inspeccionId]);

  const { data: secciones, isLoading: loadingSecciones } = useQuery({
    queryKey: ["secciones-inspeccion"],
    queryFn: getSeccionesConPreguntas,
  });

  const {
    data: inspeccion,
    isLoading: loadingInspeccion,
    error: inspeccionError,
  } = useQuery({
    queryKey: ["inspeccion", inspeccionId],
    queryFn: () => getInspeccionById(inspeccionId),
  });

  // Initialize fecha de inspección y estado de firma desde el servidor (una vez)
  useEffect(() => {
    if (inspeccion && !datosInitRef.current) {
      setFechaInspeccionValue(dateToInputValue(inspeccion.fechaInspeccion ?? inspeccion.fecha));
      setHasFirma(!!inspeccion.firmaR2Key);
      datosInitRef.current = true;
    }
  }, [inspeccion]);

  const fechaMutation = useMutation({
    mutationFn: (fecha: string | null) => actualizarFechaInspeccion(inspeccionId, fecha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspecciones"] });
    },
    onError: () => toast.error("Error al actualizar la fecha de inspección"),
  });

  // Initialize respuestas map from server data
  useEffect(() => {
    if (inspeccion?.respuestas && !initializedRef.current) {
      const map = new Map<string, RespuestaLocal>();
      for (const r of inspeccion.respuestas) {
        map.set(r.preguntaId, {
          valor: r.valor as "si" | "no" | "na" | null,
          observaciones: r.observaciones ?? "",
          accionIds: r.accionesSeleccionadas.map((a: { accionId: string }) => a.accionId),
          imagenes:
            (r as any).imagenes?.map((img: any) => ({ id: img.id, r2Key: img.r2Key })) ?? [],
        });
      }
      setRespuestas(map);
      initializedRef.current = true;
    }
  }, [inspeccion]);

  const saveMutation = useMutation({
    mutationFn: guardarRespuesta,
    onMutate: (variables) => {
      setSavingIds((prev) => new Set(prev).add(variables.preguntaId));
    },
    onSettled: (_data, _error, variables) => {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.preguntaId);
        return next;
      });
      setHasSaved(true);
    },
    onError: (_error, variables) => {
      toast.error(`Error al guardar respuesta para ${variables.preguntaId}`);
    },
  });

  const handleSave = useCallback(
    (preguntaId: string, valor: "si" | "no" | "na", observaciones: string, accionIds: string[]) => {
      // Update local state immediately
      setRespuestas((prev) => {
        const next = new Map(prev);
        const existing = prev.get(preguntaId);
        next.set(preguntaId, {
          valor,
          observaciones,
          accionIds,
          imagenes: existing?.imagenes ?? [],
        });
        return next;
      });

      // Persist to server
      saveMutation.mutate({
        formularioId: inspeccionId,
        preguntaId,
        valor,
        observaciones: observaciones || null,
        accionIds: valor === "no" ? accionIds : [],
      });
    },
    [inspeccionId, saveMutation]
  );

  const handleImageUploaded = useCallback(
    (preguntaId: string, imagen: { id: string; r2Key: string }) => {
      setRespuestas((prev) => {
        const next = new Map(prev);
        const existing = prev.get(preguntaId);
        next.set(preguntaId, {
          valor: existing?.valor ?? "na",
          observaciones: existing?.observaciones ?? "",
          accionIds: existing?.accionIds ?? [],
          imagenes: [...(existing?.imagenes ?? []), imagen],
        });
        return next;
      });
    },
    []
  );

  const handleImageDeleted = useCallback((preguntaId: string, imagenId: string) => {
    setRespuestas((prev) => {
      const existing = prev.get(preguntaId);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(preguntaId, {
        ...existing,
        imagenes: existing.imagenes.filter((img) => img.id !== imagenId),
      });
      return next;
    });
  }, []);

  const [finalizing, setFinalizing] = useState(false);

  const handleFinalize = useCallback(async () => {
    if (!secciones) return;

    // Validate all visible questions have a response
    const allPreguntas = collectAllPreguntas(secciones as unknown as SeccionData[]);
    const visibleIds = collectVisiblePreguntaIds(allPreguntas, respuestas);
    const unanswered = visibleIds.filter((id) => !respuestas.get(id)?.valor);

    if (unanswered.length > 0) {
      toast.error(
        `Faltan ${unanswered.length} pregunta${unanswered.length > 1 ? "s" : ""} por responder`
      );
      return;
    }

    setFinalizing(true);
    try {
      await finalizarInspeccion(inspeccionId);
      toast.success("Inspeccion finalizada correctamente");
      await queryClient.invalidateQueries({
        queryKey: ["inspeccion", inspeccionId],
      });
      initializedRef.current = false;
    } catch {
      toast.error("Error al finalizar la inspeccion");
    } finally {
      setFinalizing(false);
    }
  }, [secciones, respuestas, inspeccionId, queryClient]);

  const isLoading = loadingSecciones || loadingInspeccion;
  const readOnly = inspeccion?.estado === "completada";

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (inspeccionError || !inspeccion) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span>Error al cargar la inspeccion</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Inspeccion - {inspeccion.cliente.name}</h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{TIPO_LABELS[inspeccion.tipo] ?? inspeccion.tipo}</Badge>
                <Badge variant={inspeccion.estado === "completada" ? "default" : "outline"}>
                  {ESTADO_LABELS[inspeccion.estado] ?? inspeccion.estado}
                </Badge>
                <span>
                  Fecha inspección: {formatDateOnly(inspeccion.fechaInspeccion ?? inspeccion.fecha)}
                </span>
                <span>Confección: {formatDateOnly(inspeccion.createdAt)}</span>
                {(inspeccion.clientLocation?.name || inspeccion.lugarTexto) && (
                  <span>Lugar: {inspeccion.clientLocation?.name ?? inspeccion.lugarTexto}</span>
                )}
                <span>
                  Realizado por: {inspeccion.realizadoPor.name ?? inspeccion.realizadoPor.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Botón descargar PDF (solo inspecciones completadas) */}
              {inspeccion.estado === "completada" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-1 h-4 w-4" />
                  )}
                  {downloadingPdf ? "Generando..." : "Descargar PDF"}
                </Button>
              )}

              {/* Save status indicator */}
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                {savingIds.size > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  hasSaved && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Guardado</span>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {readOnly && (
          <CardContent className="pt-0">
            <div className="bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              Esta inspeccion fue completada y es de solo lectura
            </div>
          </CardContent>
        )}
      </Card>

      {/* Datos del informe: fecha de inspección editable + firma del responsable */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {!readOnly && (
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="fecha-inspeccion">Fecha de la inspección</Label>
              <Input
                id="fecha-inspeccion"
                type="date"
                value={fechaInspeccionValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setFechaInspeccionValue(value);
                  fechaMutation.mutate(value || null);
                }}
              />
              <p className="text-muted-foreground text-xs">
                Día en que se realizó la inspección (distinto de la fecha de confección del
                informe).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Firma del responsable</Label>
            <FirmaCapture
              formularioId={inspeccionId}
              hasFirma={hasFirma}
              readOnly={readOnly}
              onFirmaChange={setHasFirma}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {(secciones as unknown as SeccionData[] | undefined)?.map((seccion) => (
          <InspeccionSeccion
            key={seccion.id}
            seccion={seccion}
            respuestas={respuestas}
            readOnly={readOnly}
            onSave={handleSave}
            savingIds={savingIds}
            formularioId={inspeccionId}
            onImageUploaded={handleImageUploaded}
            onImageDeleted={handleImageDeleted}
          />
        ))}
      </div>

      {/* Finalize button */}
      {inspeccion.estado === "borrador" && (
        <div className="flex justify-end">
          <Button size="lg" onClick={handleFinalize} disabled={finalizing}>
            {finalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Inspeccion
          </Button>
        </div>
      )}
    </div>
  );
}
