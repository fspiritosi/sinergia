"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDateOnly } from "@/lib/dates";
import { getSeccionesConPreguntas, getInspeccionById } from "./actions";
import { guardarRespuesta, finalizarInspeccion } from "./inspeccion-actions";
import { InspeccionSeccion, type SeccionData } from "./inspeccion-seccion";
import type { RespuestaLocal, PreguntaData } from "./inspeccion-pregunta";

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
    if (r?.valor === "si" && p.hijasCondicionales.length > 0) {
      ids.push(...collectVisiblePreguntaIds(p.hijasCondicionales, respuestas));
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
  const initializedRef = useRef(false);

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

  // Initialize respuestas map from server data
  useEffect(() => {
    if (inspeccion?.respuestas && !initializedRef.current) {
      const map = new Map<string, RespuestaLocal>();
      for (const r of inspeccion.respuestas) {
        map.set(r.preguntaId, {
          valor: r.valor as "si" | "no" | "na" | null,
          observaciones: r.observaciones ?? "",
          accionIds: r.accionesSeleccionadas.map((a: { accionId: string }) => a.accionId),
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
        next.set(preguntaId, { valor, observaciones, accionIds });
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

  const [finalizing, setFinalizing] = useState(false);

  const handleFinalize = useCallback(async () => {
    if (!secciones) return;

    // Validate all visible questions have a response
    const allPreguntas = collectAllPreguntas(secciones as SeccionData[]);
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
                <span>Fecha: {formatDateOnly(inspeccion.fecha)}</span>
                {(inspeccion.clientLocation?.name || inspeccion.lugarTexto) && (
                  <span>Lugar: {inspeccion.clientLocation?.name ?? inspeccion.lugarTexto}</span>
                )}
                <span>
                  Realizado por: {inspeccion.realizadoPor.name ?? inspeccion.realizadoPor.email}
                </span>
              </div>
            </div>

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

      {/* Sections */}
      <div className="space-y-4">
        {(secciones as SeccionData[] | undefined)?.map((seccion) => (
          <InspeccionSeccion
            key={seccion.id}
            seccion={seccion}
            respuestas={respuestas}
            readOnly={readOnly}
            onSave={handleSave}
            savingIds={savingIds}
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
