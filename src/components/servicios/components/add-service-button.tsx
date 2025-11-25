"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceForm } from "./service-form"
import { createServicio } from "../../servicios/components/service-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddServiceButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createServicio(data)
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
                Agregar Servicio
            </Button>
            <ServiceForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}