"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Informe } from "./actions"

interface InformeViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  informe: Informe
}

export function InformeViewerDialog({ open, onOpenChange, informe }: InformeViewerDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  const handleDownload = () => {
    window.open(`/api/informes/file/${informe.id}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Informe - {informe.cliente?.name} / {informe.tipoDeInforme?.name}
          </DialogTitle>
          <DialogDescription>
            Visualizá el archivo generado para este informe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-gray-100">
          <iframe
            src={`/api/informes/file/${informe.id}`}
            className="w-full h-full"
            title="Informe PDF"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
