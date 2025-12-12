"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientLocationForm } from "./clientLocations-form"
import { createClientLocation } from "./clientLocations-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddClientLocationsButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createClientLocation(data)
            toast.success("Locacion del cliente creado exitosamente")
        } catch (error) {
            toast.error("Error al crear la locacion del cliente")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Locación
            </Button>
            <ClientLocationForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}