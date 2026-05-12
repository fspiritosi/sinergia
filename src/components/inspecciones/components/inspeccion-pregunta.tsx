"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreguntaData = {
  id: string;
  codigo: string;
  texto: string;
  acciones: { id: string; texto: string; orden: number }[];
  hijasCondicionales: PreguntaData[];
  condicionRespuesta: string | null;
};

export type RespuestaLocal = {
  valor: "si" | "no" | "na" | null;
  observaciones: string;
  accionIds: string[];
};

type Props = {
  pregunta: PreguntaData;
  respuestas: Map<string, RespuestaLocal>;
  readOnly: boolean;
  onSave: (
    preguntaId: string,
    valor: "si" | "no" | "na",
    observaciones: string,
    accionIds: string[]
  ) => void;
  savingIds: Set<string>;
};

export function InspeccionPregunta({ pregunta, respuestas, readOnly, onSave, savingIds }: Props) {
  // Derive values from the respuestas map (single source of truth from parent)
  const existing = useMemo(() => respuestas.get(pregunta.id), [respuestas, pregunta.id]);
  const valor = existing?.valor ?? null;
  const accionIds = useMemo(() => existing?.accionIds ?? [], [existing?.accionIds]);

  // Observaciones uses local state for typing, synced from parent on key change
  const [localObservaciones, setLocalObservaciones] = useState(existing?.observaciones ?? "");
  const [obsKey, setObsKey] = useState(pregunta.id);
  if (obsKey !== pregunta.id) {
    setObsKey(pregunta.id);
    setLocalObservaciones(existing?.observaciones ?? "");
  }

  const [obsOpen, setObsOpen] = useState(false);

  const isSaving = savingIds.has(pregunta.id);

  const handleValorChange = useCallback(
    (newValor: "si" | "no" | "na") => {
      if (readOnly) return;

      // Clear accionIds when switching away from NO
      const newAccionIds = newValor !== "no" ? [] : accionIds;

      onSave(pregunta.id, newValor, localObservaciones, newAccionIds);
    },
    [readOnly, accionIds, localObservaciones, onSave, pregunta.id]
  );

  const handleAccionToggle = useCallback(
    (accionId: string, checked: boolean) => {
      if (readOnly || valor !== "no") return;

      const newAccionIds = checked
        ? [...accionIds, accionId]
        : accionIds.filter((id) => id !== accionId);

      if (valor) {
        onSave(pregunta.id, valor, localObservaciones, newAccionIds);
      }
    },
    [readOnly, valor, accionIds, localObservaciones, onSave, pregunta.id]
  );

  const handleObservacionesBlur = useCallback(() => {
    if (readOnly || !valor) return;
    onSave(pregunta.id, valor, localObservaciones, accionIds);
  }, [readOnly, valor, localObservaciones, accionIds, onSave, pregunta.id]);

  return (
    <div className="space-y-2">
      {/* Question header */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className="font-bold">{pregunta.codigo}</span> <span>{pregunta.texto}</span>
        </div>
        {isSaving && (
          <Loader2 className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        )}
      </div>

      {/* SÍ / NO / NA buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={valor === "si" ? "default" : "outline"}
          className={cn(valor === "si" && "bg-green-600 text-white hover:bg-green-700")}
          disabled={readOnly}
          onClick={() => handleValorChange("si")}
        >
          SI
        </Button>
        <Button
          size="sm"
          variant={valor === "no" ? "default" : "outline"}
          className={cn(valor === "no" && "bg-red-600 text-white hover:bg-red-700")}
          disabled={readOnly}
          onClick={() => handleValorChange("no")}
        >
          NO
        </Button>
        <Button
          size="sm"
          variant={valor === "na" ? "default" : "outline"}
          className={cn(valor === "na" && "bg-gray-500 text-white hover:bg-gray-600")}
          disabled={readOnly}
          onClick={() => handleValorChange("na")}
        >
          NA
        </Button>
      </div>

      {/* Acciones correctivas (visible when NO) */}
      {valor === "no" && pregunta.acciones.length > 0 && (
        <div className="bg-muted/50 ml-4 space-y-2 rounded-md border p-3">
          <p className="text-muted-foreground text-sm font-medium">Acciones correctivas:</p>
          {pregunta.acciones.map((accion) => (
            <div key={accion.id} className="flex items-center gap-2">
              <Checkbox
                id={`accion-${accion.id}`}
                checked={accionIds.includes(accion.id)}
                disabled={readOnly}
                onCheckedChange={(checked) => handleAccionToggle(accion.id, checked === true)}
              />
              <Label htmlFor={`accion-${accion.id}`} className="text-sm font-normal">
                {accion.texto}
              </Label>
            </div>
          ))}
        </div>
      )}

      {/* Observaciones (collapsible, always available) */}
      {valor && (
        <Collapsible open={obsOpen} onOpenChange={setObsOpen}>
          <CollapsibleTrigger className="text-muted-foreground flex items-center gap-1 text-sm hover:underline">
            {obsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Observaciones
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Textarea
              placeholder="Agregar observaciones..."
              value={localObservaciones}
              onChange={(e) => setLocalObservaciones(e.target.value)}
              onBlur={handleObservacionesBlur}
              disabled={readOnly}
              className="min-h-[60px] text-sm"
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Conditional children (visible when SÍ and has children) */}
      {valor === "si" && pregunta.hijasCondicionales.length > 0 && (
        <div className="border-primary/30 ml-4 space-y-4 border-l-2 pl-4">
          {pregunta.hijasCondicionales.map((hija) => (
            <InspeccionPregunta
              key={hija.id}
              pregunta={hija}
              respuestas={respuestas}
              readOnly={readOnly}
              onSave={onSave}
              savingIds={savingIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
