"use client"

import { MoreHorizontal, CheckCircle2, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Informe } from "./actions"
import { completarInforme } from "./actions"
import { InformeViewerDialog } from "./informe-viewer-dialog"
import { toast } from "sonner"
import { useState, type ChangeEvent } from "react"
import { useFormStatus } from "react-dom"
import { formatDateOnly, formatDateTime, parseCalendarStringToDate } from "@/lib/dates"

interface InformeRowActionsProps {
  informe: Informe
}

const MAX_FILE_SIZE_MB = 1

export function InformeRowActions({ informe }: InformeRowActionsProps) {
  const [realizadoOpen, setRealizadoOpen] = useState(false)
  const [verOpen, setVerOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const isPendiente = informe.estado === "pendiente"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          {isPendiente ? (
            <DropdownMenuItem onClick={() => setRealizadoOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4 hover:text-white" />
              Marcar como realizado
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setViewerOpen(true)}>
                <FileText className="mr-2 h-4 w-4 hover:text-white" />
                Ver informe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVerOpen(true)}>
                <Eye className="mr-2 h-4 w-4 hover:text-white" />
                Ver detalle
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={realizadoOpen} onOpenChange={setRealizadoOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Marcar informe como realizado</DialogTitle>
            <DialogDescription>
              Completá quién realizó el informe y adjuntá el archivo generado.
            </DialogDescription>
          </DialogHeader>

          <form
            action={completarInforme}
            className="space-y-4 py-2"
            onSubmit={() => setRealizadoOpen(false)}
          >
            <input type="hidden" name="informeId" value={informe.id} />

            <div className="space-y-2">
              <Label htmlFor="quien">Quién lo realizó *</Label>
              <Input
                id="quien"
                name="responsable"
                placeholder="Nombre de la persona que realizó el informe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjunto">Archivo del informe *</Label>
              <Input
                id="adjunto"
                type="file"
                name="file"
                required
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024
                  if (file.size > maxBytes) {
                    toast.error(`El archivo supera el tamaño máximo de ${MAX_FILE_SIZE_MB} MB`)
                    e.target.value = ""
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Tamaño máximo permitido: {MAX_FILE_SIZE_MB} MB
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRealizadoOpen(false)}
              >
                Cancelar
              </Button>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={verOpen} onOpenChange={setVerOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Detalle del informe</DialogTitle>
            <DialogDescription>
              Información completa del informe generado a partir de la propuesta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <span className="font-medium">Cliente: </span>
              <span>{informe.cliente.name}</span>
            </div>
            <div>
              <span className="font-medium">Propuesta: </span>
              <span>{informe.propuesta.codigo}</span>
            </div>
            <div>
              <span className="font-medium">Tipo de informe: </span>
              <span>{informe.tipoDeInforme.name}</span>
            </div>
            <div>
              <span className="font-medium">Locación: </span>
              <span>{informe.clientLocation.name}</span>
            </div>
            <div>
              <span className="font-medium">Fecha de compromiso: </span>
              <span>{formatDateOnly(informe.fechaVencimiento, "es-AR")}</span>
            </div>
            <div>
              <span className="font-medium">Fecha de realización: </span>
              <span>{formatDateTime(informe.updatedAt, "es-AR")}</span>
            </div>
            <div>
              <span className="font-medium">Calidad: </span>
              {(() => {
                  const fechaVencimiento =
  informe.fechaVencimiento instanceof Date
    ? informe.fechaVencimiento
    : parseCalendarStringToDate(informe.fechaVencimiento)
  const fechaRealizacion = new Date(informe.updatedAt)
  const diffTime = fechaRealizacion.getTime() - fechaVencimiento.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return <span className="text-green-600">A tiempo ({Math.abs(diffDays)} días antes)</span>
  } else {
    return <span className="text-red-600">Fuera de plazo ({diffDays} días después)</span>
  }
})()}
            </div>
            <div>
              <span className="font-medium">Estado: </span>
              <span>{informe.estado === "pendiente" ? "Pendiente" : "Entregado"}</span>
            </div>
            {informe.responsableConfeccion && (
              <div>
                <span className="font-medium">Quién lo realizó: </span>
                <span>{informe.responsableConfeccion}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InformeViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        informe={informe}
      />
    </>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-sinergia text-white hover:bg-sinergia-hover"
    >
      {pending ? "Guardando..." : "Marcar como realizado"}
    </Button>
  )
}
