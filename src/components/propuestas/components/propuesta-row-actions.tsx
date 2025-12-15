"use client"

import { MoreHorizontal, Edit, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PropuestaForm } from "./propuesta-form"
import { PDFViewerDialog } from "./pdf-viewer-dialog"
import { updatePropuesta, deletePropuesta } from "./propuesta-actions"
import { getActiveClientLocations, type ClientLocationBasic } from "@/components/clientLocations/components/actions"
import { generateInformesFromPropuesta } from "@/components/informes/components/actions"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import type { PropuestaTecnica } from "./actions"

interface PropuestaRowActionsProps {
    propuesta: PropuestaTecnica
}

export function PropuestaRowActions({ propuesta }: PropuestaRowActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [generateInformesOpen, setGenerateInformesOpen] = useState(false)
    const [pendingUpdate, setPendingUpdate] = useState<any | null>(null)

    const handleEdit = async (data: any) => {
        const statusChangedToAprobada = propuesta.status !== "aprobada" && data.status === "aprobada"
        const isUnitario = propuesta.servicios?.type === "unitario"

        if (statusChangedToAprobada && isUnitario) {
            setPendingUpdate(data)
            setEditOpen(false)
            setGenerateInformesOpen(true)
            return
        }

        setIsLoading(true)
        try {
            await updatePropuesta({ ...data, id: propuesta.id })
            toast.success("Propuesta actualizada exitosamente")
        } catch (error) {
            toast.error("Error al actualizar la propuesta")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deletePropuesta(propuesta.id)
            toast.success("Propuesta eliminada exitosamente")
            setDeleteOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar la propuesta")
        } finally {
            setIsLoading(false)
        }
    }

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
                <DropdownMenuContent align="end" className="w-[160px]">

                    <DropdownMenuItem onClick={() => setPdfViewerOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver PDF
                    </DropdownMenuItem>

                    {propuesta.status !== "aprobada" && (
                        <DropdownMenuItem onClick={() => setEditOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            <PropuestaForm
                open={editOpen}
                onOpenChange={setEditOpen}
                propuesta={propuesta}
                onSubmit={handleEdit}
                isLoading={isLoading}
            />

            <PDFViewerDialog
                open={pdfViewerOpen}
                onOpenChange={setPdfViewerOpen}
                propuestaId={propuesta.id}
                codigo={propuesta.codigo}
            />

            <GenerarInformesDialog
                open={generateInformesOpen}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setPendingUpdate(null)
                    }
                    setGenerateInformesOpen(nextOpen)
                }}
                propuesta={propuesta}
                pendingUpdate={pendingUpdate}
                clearPendingUpdate={() => setPendingUpdate(null)}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la propuesta{" "}
                            <strong>{propuesta.codigo}</strong> y todos sus datos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

interface GenerarInformesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propuesta: PropuestaTecnica
    pendingUpdate: any | null
    clearPendingUpdate: () => void
}

function GenerarInformesDialog({
    open,
    onOpenChange,
    propuesta,
    pendingUpdate,
    clearPendingUpdate,
}: GenerarInformesDialogProps) {
    const [fecha, setFecha] = useState("")
    const [locationId, setLocationId] = useState("")
    const [locations, setLocations] = useState<ClientLocationBasic[]>([])
    const [locationsLoading, setLocationsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!open) return

        let isMounted = true
        setLocationsLoading(true)

        getActiveClientLocations(propuesta.clienteId)
            .then((result) => {
                if (!isMounted) return
                setLocations(result)
            })
            .catch((error) => {
                console.error("Error al cargar locaciones del cliente:", error)
                if (!isMounted) return
                toast.error("No se pudieron cargar las locaciones del cliente")
            })
            .finally(() => {
                if (!isMounted) return
                setLocationsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [open, propuesta.clienteId])

    const handleGenerate = async () => {
        if (!fecha || !locationId) {
            toast.error("Completá la fecha de realización y la locación")
            return
        }

        if (!pendingUpdate) {
            toast.error("No hay cambios pendientes para confirmar")
            return
        }

        setIsSubmitting(true)
        try {
            await updatePropuesta({ ...pendingUpdate, id: propuesta.id })

            const result = await generateInformesFromPropuesta({
                propuestaId: propuesta.id,
                fechaVencimiento: fecha,
                clientLocationId: locationId,
            })

            if (!result.success) {
                toast.error(result.reason ?? "No se pudieron generar los informes")
                return
            }

            toast.success(
                result.createdCount && result.createdCount > 1
                    ? `Se generaron ${result.createdCount} informes pendientes`
                    : "Se generó 1 informe pendiente",
            )
            clearPendingUpdate()
            onOpenChange(false)
        } catch (error) {
            console.error("Error al generar informes desde la propuesta:", error)
            toast.error("Error al generar los informes")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Configurar informes a generar</DialogTitle>
                    <DialogDescription>
                        Elegí la fecha de realización y la locación donde se realizarán los informes de esta propuesta.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="fechaRealizacion">Fecha de realización *</Label>
                        <Input
                            id="fechaRealizacion"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="locacion">Locación del cliente *</Label>
                        <Select
                            value={locationId || undefined}
                            onValueChange={setLocationId}
                            disabled={locationsLoading}
                        >
                            <SelectTrigger id="locacion">
                                <SelectValue
                                    placeholder={
                                        locationsLoading
                                            ? "Cargando locaciones..."
                                            : locations.length
                                                ? "Seleccioná una locación"
                                                : "No hay locaciones activas para este cliente"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            clearPendingUpdate()
                            onOpenChange(false)
                        }}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isSubmitting || !locations.length}
                        className="bg-sinergia text-white hover:bg-sinergia-hover"
                    >
                        {isSubmitting ? "Generando..." : "Generar informes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}