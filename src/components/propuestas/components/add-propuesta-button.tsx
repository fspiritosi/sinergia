"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropuestaForm } from "./propuesta-form"
import { createPropuesta } from "./propuesta-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddPropuestaButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createPropuesta(data)
            toast.success("Propuesta creada exitosamente")
        } catch (error) {
            toast.error("Error al crear la propuesta")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Crear Propuesta
            </Button>
            <PropuestaForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}