"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AsignItemForm, AssignItemsFormValues } from "./asing-items-form"
import { assignItemsToServicio } from "./items-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AsignItemButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: AssignItemsFormValues) => {
        setIsLoading(true)
        try {
            await assignItemsToServicio({
                servicioId: data.servicio,
                itemIds: data.selectedItemIds,
            })
            toast.success("Items asignados exitosamente")
        } catch (error) {
            toast.error("Error al asignar los items")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Asignar Item
            </Button>
            <AsignItemForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}