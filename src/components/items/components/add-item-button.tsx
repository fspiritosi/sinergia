"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemForm } from "./items-form"
import { createItem } from "./items-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddItemButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createItem(data)
            toast.success("Servicio creado exitosamente")
        } catch (error) {
            toast.error("Error al crear el servicio")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
            </Button>
            <ItemForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}