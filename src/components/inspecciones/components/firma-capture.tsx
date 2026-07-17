"use client";

import { useCallback, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Upload, Trash2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";
import { uploadFirmaInspeccion, deleteFirmaInspeccion } from "./inspeccion-actions";

type Props = {
  formularioId: string;
  hasFirma: boolean;
  readOnly?: boolean;
  onFirmaChange: (hasFirma: boolean) => void;
};

// Resolución interna del canvas (independiente del tamaño en pantalla).
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;

export function FirmaCapture({ formularioId, hasFirma, readOnly = false, onFirmaChange }: Props) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [version, setVersion] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => uploadFirmaInspeccion(formData),
    onSuccess: () => {
      setVersion((v) => v + 1);
      onFirmaChange(true);
      clearCanvas();
      toast.success("Firma guardada");
    },
    onError: () => toast.error("Error al guardar la firma"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFirmaInspeccion(formularioId),
    onSuccess: () => {
      onFirmaChange(false);
      toast.success("Firma eliminada");
    },
    onError: () => toast.error("Error al eliminar la firma"),
  });

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const pointerPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx) return;
      canvasRef.current?.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const { x, y } = pointerPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
    },
    [readOnly]
  );

  const handlePointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawn(true);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    drawingRef.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    if (ctx) ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    hasDrawnRef.current = false;
    setHasDrawn(false);
  }, []);

  const handleSaveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("No se pudo generar la firma");
        return;
      }
      const file = new File([blob], "firma.png", { type: "image/png" });
      const formData = new FormData();
      formData.set("formularioId", formularioId);
      formData.set("file", file);
      uploadMutation.mutate(formData);
    }, "image/png");
  }, [formularioId, uploadMutation]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      setPreparing(true);
      let toUpload = file;
      try {
        toUpload = await compressImage(file);
      } finally {
        setPreparing(false);
      }

      const formData = new FormData();
      formData.set("formularioId", formularioId);
      formData.set("file", toUpload);
      uploadMutation.mutate(formData);
    },
    [formularioId, uploadMutation]
  );

  const busy = uploadMutation.isPending || preparing;

  // Vista de solo lectura o con firma ya cargada: mostrar la imagen.
  if (hasFirma) {
    return (
      <div className="space-y-2">
        <div className="inline-block rounded-md border bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/inspecciones/firma/${formularioId}?v=${version}`}
            alt="Firma"
            className="h-24 w-auto max-w-[300px] object-contain"
          />
        </div>
        {!readOnly && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Quitar firma
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (readOnly) {
    return <p className="text-muted-foreground text-sm">Sin firma.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Selector de modo */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("draw")}
        >
          <Pencil className="mr-1 h-4 w-4" />
          Dibujar
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
        >
          <Upload className="mr-1 h-4 w-4" />
          Subir imagen
        </Button>
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={cn(
              "w-full max-w-[600px] touch-none rounded-md border bg-white",
              "cursor-crosshair"
            )}
            style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
          />
          <p className="text-muted-foreground text-xs">
            Firmá dentro del recuadro con el dedo o el mouse.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDrawing}
              disabled={!hasDrawn || busy}
            >
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Guardar firma
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={!hasDrawn || busy}
            >
              <Eraser className="mr-1 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1 h-4 w-4" />
            )}
            {preparing ? "Procesando..." : busy ? "Subiendo..." : "Seleccionar imagen"}
          </Button>
          <p className="text-muted-foreground text-xs">Subí una foto o imagen de la firma.</p>
        </div>
      )}
    </div>
  );
}
