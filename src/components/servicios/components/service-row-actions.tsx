"use client"

import { MoreHorizontal, Edit, Eye } from "lucide-react"
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
import { ServiceForm, ServiceFormSubmitData } from "./service-form"
import { updateServicio, deleteServicio, updateServicioItems } from "../../servicios/components/service-actions"
import { ServiceDetailDialog } from "./service-detail-dialog"
import { Servicio } from "./actions"
import { toast } from "sonner"
import { useState } from "react"

interface ServiceRowActionsProps {
    servicio: Servicio
}

export function ServiceRowActions({ servicio }: ServiceRowActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleEdit = async (data: ServiceFormSubmitData) => {
        setIsLoading(true)
        try {
            const { itemIdsToKeep, ...serviceData } = data

            await updateServicio({ ...serviceData, id: servicio.id })

            if (itemIdsToKeep) {
                await updateServicioItems({
                    servicioId: servicio.id,
                    itemIds: itemIdsToKeep,
                })
            }
            toast.success("Servicio actualizado exitosamente")
        } catch (error) {
            toast.error("Error al actualizar el servicio")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteServicio(servicio.id)
            toast.success("Servicio eliminado exitosamente")
            setDeleteOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar el servicio")
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

                    <DropdownMenuItem onClick={() => setDetailOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>

            <ServiceForm
                open={editOpen}
                onOpenChange={setEditOpen}
                servicio={servicio}
                onSubmit={handleEdit}
                isLoading={isLoading}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el servicio{" "}
                            <strong>{servicio.name}</strong> y todos sus datos asociados.
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

            <ServiceDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                servicio={servicio}
                onEdit={() => {
                    setDetailOpen(false)
                    setEditOpen(true)
                }}
            />
        </>
    )
}