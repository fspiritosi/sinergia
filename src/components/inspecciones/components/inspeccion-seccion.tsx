"use client";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Minus, Plus } from "lucide-react";
import { InspeccionPregunta, type PreguntaData, type RespuestaLocal } from "./inspeccion-pregunta";

export type SeccionData = {
  id: string;
  codigo: string;
  titulo: string;
  hijas?: SeccionData[];
  preguntas: PreguntaData[];
};

type Props = {
  seccion: SeccionData;
  respuestas: Map<string, RespuestaLocal>;
  readOnly: boolean;
  onSave: (
    preguntaId: string,
    valor: "si" | "no" | "na",
    observaciones: string,
    accionIds: string[]
  ) => void;
  savingIds: Set<string>;
  formularioId: string;
  r2PublicBase: string;
};

/**
 * Count all questions in a section tree (including nested sub-sections).
 */
function countAllPreguntas(seccion: SeccionData): number {
  let count = seccion.preguntas.length;
  for (const hija of seccion.hijas ?? []) {
    count += countAllPreguntas(hija);
  }
  return count;
}

/**
 * Count answered questions (non-null valor) in a section tree.
 */
function countRespondidas(seccion: SeccionData, respuestas: Map<string, RespuestaLocal>): number {
  let count = 0;
  for (const pregunta of seccion.preguntas) {
    const r = respuestas.get(pregunta.id);
    if (r?.valor) count++;
  }
  for (const hija of seccion.hijas ?? []) {
    count += countRespondidas(hija, respuestas);
  }
  return count;
}

export function InspeccionSeccion({
  seccion,
  respuestas,
  readOnly,
  onSave,
  savingIds,
  formularioId,
  r2PublicBase,
}: Props) {
  const [open, setOpen] = useState(true);

  const total = countAllPreguntas(seccion);
  const respondidas = countRespondidas(seccion, respuestas);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors">
        <div className="flex items-center gap-2">
          {open ? (
            <Minus className="text-muted-foreground h-4 w-4" />
          ) : (
            <Plus className="text-muted-foreground h-4 w-4" />
          )}
          <span className="font-semibold">
            {seccion.codigo} {seccion.titulo}
          </span>
        </div>
        <span className="text-muted-foreground text-sm">
          {respondidas}/{total} respondidas
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 px-4 pt-3">
        {/* Sub-sections */}
        {(seccion.hijas ?? []).map((hija) => (
          <InspeccionSeccion
            key={hija.id}
            seccion={hija}
            respuestas={respuestas}
            readOnly={readOnly}
            onSave={onSave}
            savingIds={savingIds}
            formularioId={formularioId}
            r2PublicBase={r2PublicBase}
          />
        ))}

        {/* Questions (root only; conditional children rendered by InspeccionPregunta) */}
        {seccion.preguntas.map((pregunta) => (
          <InspeccionPregunta
            key={pregunta.id}
            pregunta={pregunta}
            respuestas={respuestas}
            readOnly={readOnly}
            onSave={onSave}
            savingIds={savingIds}
            formularioId={formularioId}
            r2PublicBase={r2PublicBase}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
