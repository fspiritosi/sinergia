"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TipoInformeForm } from "./tipoInforme-form"
import { createTipoDeInforme } from "./tipoInforme-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddServiceButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createTipoDeInforme(data)
            toast.success("Tipo de Informe creado exitosamente")
        } catch (error) {
            toast.error("Error al crear el tipo de informe")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Tipo de Informe
            </Button>
            <TipoInformeForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}