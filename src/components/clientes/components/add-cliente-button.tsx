"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClienteForm } from "./cliente-form"
import { createCliente } from "./cliente-actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddClienteButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createCliente(data)
            toast.success("Cliente creado exitosamente")
        } catch (error) {
            toast.error("Error al crear el cliente")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Cliente
            </Button>
            <ClienteForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}