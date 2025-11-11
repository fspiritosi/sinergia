"use client"

import { MoreHorizontal, Edit } from "lucide-react"
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
import { ClienteForm } from "./cliente-form"
import { updateCliente, deleteCliente } from "./cliente-actions"
import { Cliente } from "./actions"
import { toast } from "sonner"
import { useState } from "react"

interface ClienteRowActionsProps {
    cliente: Cliente
}

export function ClienteRowActions({ cliente }: ClienteRowActionsProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleEdit = async (data: any) => {
        setIsLoading(true)
        try {
            await updateCliente({ ...data, id: cliente.id })
            toast.success("Cliente actualizado exitosamente")
        } catch (error) {
            toast.error("Error al actualizar el cliente")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteCliente(cliente.id)
            toast.success("Cliente eliminado exitosamente")
            setDeleteOpen(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al eliminar el cliente")
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

                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>

            <ClienteForm
                open={editOpen}
                onOpenChange={setEditOpen}
                cliente={cliente}
                onSubmit={handleEdit}
                isLoading={isLoading}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{" "}
                            <strong>{cliente.name}</strong> y todos sus datos asociados.
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