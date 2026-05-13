"use client";

import { useState, useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, ChevronDown, ChevronRight, ChevronLeft, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImagenRespuesta, deleteImagenRespuesta } from "./inspeccion-actions";

export type PreguntaData = {
  id: string;
  codigo: string;
  texto: string;
  acciones: { id: string; texto: string; orden: number }[];
  hijasCondicionales?: PreguntaData[];
  condicionRespuesta: string | null;
};

export type ImagenLocal = {
  id: string;
  r2Key: string;
};

export type RespuestaLocal = {
  valor: "si" | "no" | "na" | null;
  observaciones: string;
  accionIds: string[];
  imagenes: ImagenLocal[];
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
  formularioId: string;
  r2PublicBase: string;
};

const MAX_IMAGENES = 3;
const MAX_FILE_SIZE_MB = 5;

export function InspeccionPregunta({
  pregunta,
  respuestas,
  readOnly,
  onSave,
  savingIds,
  formularioId,
  r2PublicBase,
}: Props) {
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const imagenes = useMemo(() => existing?.imagenes ?? [], [existing?.imagenes]);

  const isSaving = savingIds.has(pregunta.id);

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadImagenRespuesta(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspeccion", formularioId] });
    },
    onError: () => {
      toast.error("Error al subir la imagen");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imagenId: string) => deleteImagenRespuesta(imagenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspeccion", formularioId] });
    },
    onError: () => {
      toast.error("Error al eliminar la imagen");
    },
  });

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`La imagen supera el tamaño máximo de ${MAX_FILE_SIZE_MB} MB`);
        e.target.value = "";
        return;
      }

      const formData = new FormData();
      formData.set("formularioId", formularioId);
      formData.set("preguntaId", pregunta.id);
      formData.set("file", file);
      uploadMutation.mutate(formData);
      e.target.value = "";
    },
    [formularioId, pregunta.id, uploadMutation]
  );

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

      {/* Imágenes adjuntas */}
      {valor && (
        <div className="ml-4 space-y-2">
          {imagenes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imagenes.map((img, idx) => (
                <div key={img.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="block overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={`${r2PublicBase}/${img.r2Key}`}
                      alt={`Adjunto ${idx + 1}`}
                      className="h-20 w-20 object-cover transition-transform hover:scale-105"
                    />
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(img.id)}
                      disabled={deleteMutation.isPending}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {!readOnly && imagenes.length < MAX_IMAGENES && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="mr-1 h-3 w-3" />
                )}
                {uploadMutation.isPending ? "Subiendo..." : "Adjuntar foto"}
              </Button>
            </>
          )}

          {/* Lightbox / galería */}
          <Dialog
            open={lightboxOpen}
            onOpenChange={(open) => {
              setLightboxOpen(open);
              if (!open) {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }
            }}
          >
            <DialogContent
              className="sm:max-w-[90vw] max-h-[95vh] w-fit p-4"
              showCloseButton={true}
            >
              {imagenes.length > 0 && (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="relative overflow-hidden rounded-md"
                    style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
                    onWheel={(e) => {
                      e.preventDefault();
                      setZoom((z) => {
                        const next = z + (e.deltaY < 0 ? 0.25 : -0.25);
                        const clamped = Math.min(Math.max(next, 1), 5);
                        if (clamped === 1) setPan({ x: 0, y: 0 });
                        return clamped;
                      });
                    }}
                    onClick={() => {
                      if (zoom === 1) {
                        setZoom(2);
                      } else {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }
                    }}
                    onMouseDown={(e) => {
                      if (zoom <= 1) return;
                      e.preventDefault();
                      setDragging(true);
                      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                    }}
                    onMouseMove={(e) => {
                      if (!dragging) return;
                      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                    }}
                    onMouseUp={() => setDragging(false)}
                    onMouseLeave={() => setDragging(false)}
                    onTouchStart={(e) => {
                      if (zoom <= 1 || e.touches.length !== 1) return;
                      const t = e.touches[0];
                      setDragging(true);
                      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
                    }}
                    onTouchMove={(e) => {
                      if (!dragging || e.touches.length !== 1) return;
                      const t = e.touches[0];
                      setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
                    }}
                    onTouchEnd={() => setDragging(false)}
                  >
                    <img
                      src={`${r2PublicBase}/${imagenes[lightboxIndex]?.r2Key}`}
                      alt={`Imagen ${lightboxIndex + 1} de ${imagenes.length}`}
                      className="max-h-[75vh] max-w-[85vw] select-none object-contain transition-transform duration-150"
                      style={{
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      }}
                      draggable={false}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={lightboxIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((i) => i - 1);
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {lightboxIndex + 1} / {imagenes.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={lightboxIndex === imagenes.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex((i) => i + 1);
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {zoom > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Zoom: {Math.round(zoom * 100)}% — click para resetear, scroll para ajustar
                    </p>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
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
      {valor === "si" && (pregunta.hijasCondicionales?.length ?? 0) > 0 && (
        <div className="border-primary/30 ml-4 space-y-4 border-l-2 pl-4">
          {pregunta.hijasCondicionales?.map((hija) => (
            <InspeccionPregunta
              key={hija.id}
              pregunta={hija}
              respuestas={respuestas}
              readOnly={readOnly}
              onSave={onSave}
              savingIds={savingIds}
              formularioId={formularioId}
              r2PublicBase={r2PublicBase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
