"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserForm } from "./user-form"
import { createUserAction } from "./actions"
import { toast } from "sonner"
import { useState } from "react"

export function AddUserButton() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await createUserAction(data)
            toast.success("Usuarui creado exitosamente")
        } catch (error) {
            toast.error("Error al crear el Usuario")
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-sinergia text-white hover:bg-sinergia-hover">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
            </Button>
            <UserForm
                open={open}
                onOpenChange={setOpen}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </>
    )
}