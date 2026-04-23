"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";
import { generatePlanTrabajoPDF } from "./pdf-actions";
import { toast } from "sonner";

interface PlanTrabajoPDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTrabajoId: string;
  propuestaCodigo: string;
}

export function PlanTrabajoPDFViewerDialog({
  open,
  onOpenChange,
  planTrabajoId,
  propuestaCodigo,
}: PlanTrabajoPDFViewerDialogProps) {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && !pdfData) {
      handleGeneratePDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    try {
      const result = await generatePlanTrabajoPDF(planTrabajoId);

      if (result.success && result.data) {
        setPdfData(result.data);
        setFilename(result.filename);
      } else {
        toast.error(
          ("error" in result && result.error) || "Error al generar PDF del plan de trabajo"
        );
        onOpenChange(false);
      }
    } catch {
      toast.error("Error al generar PDF del plan de trabajo");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfData) return;

    const byteCharacters = atob(pdfData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("PDF descargado correctamente");
  };

  const handleClose = () => {
    setPdfData(null);
    setFilename("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa - Plan de Trabajo {propuestaCodigo}</DialogTitle>
          <DialogDescription>Visualiza el PDF antes de descargarlo</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-gray-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Generando PDF...</p>
              </div>
            </div>
          ) : pdfData ? (
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          <Button onClick={handleDownload} disabled={!pdfData || isLoading} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
