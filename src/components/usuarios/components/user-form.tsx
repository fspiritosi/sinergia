"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { useEffect, useMemo, useState } from "react"

import { getActiveItems } from "@/components/items/components/actions"
import { Items } from "@/generated/client"
import { X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const userSchema = z.object({
    email: z.string().min(1, "El email es requerido"),
    firstName: z.string().min(1, "El nombre del usuario es requerido"),
    lastName: z.string().min(1, "El apellido del usuario es requerido"),
    role: z.string().min(1, "El rol del usuario es requerido"),
})

type UserFormData = z.infer<typeof userSchema>

export type UserFormSubmitData = UserFormData & {
    itemIdsToKeep?: string[]
}

interface ServiceFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void   
    // servicio?: Servicio | null    
    onSubmit: (data: UserFormSubmitData) => Promise<void>
    isLoading?: boolean
}

export function UserForm({
    open,
    onOpenChange,
    // servicio,
    onSubmit,
    isLoading = false,
}: ServiceFormProps) {
   // const isEditing = !!    servicio
    const [assignedItems, setAssignedItems] = useState<Items[]>([])
    const [itemsLoading, setItemsLoading] = useState(false)
    const [itemsError, setItemsError] = useState<string | null>(null)
    const [activeItems, setActiveItems] = useState<Items[]>([])
    const [activeItemsLoading, setActiveItemsLoading] = useState(false)
    const [activeItemsError, setActiveItemsError] = useState<string | null>(null)
    const [isAddingItems, setIsAddingItems] = useState(false)
    const [selectedNewItemIds, setSelectedNewItemIds] = useState<string[]>([])

    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            email: "",
            firstName: "",
            lastName: "",
            role: "",
        },
    })

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    // useEffect(() => {
    //     if (open) {
    //         if (servicio) {
    //             form.reset({
    //                 name: servicio.name,
    //                 description: servicio.description,
    //                 is_active: servicio.is_active,
    //             })
    //         } else {
    //             form.reset({
    //                 name: "",
    //                 description: "",
    //                 is_active: true,
    //             })
    //         }   
    //     }
    // }, [open, servicio, form])

    useEffect(() => {
        if (!open ) {
            setAssignedItems([])
            setItemsError(null)
            setItemsLoading(false)
            setIsAddingItems(false)
            setSelectedNewItemIds([])
            return
        }

        let isMounted = true
        setItemsLoading(true)
        setItemsError(null)

        
    }, [open])

    useEffect(() => {
        if (!open) {
            setActiveItems([])
            setActiveItemsError(null)
            setActiveItemsLoading(false)
            return
        }

        let isMounted = true
        setActiveItemsLoading(true)
        setActiveItemsError(null)

        getActiveItems()
            .then((items) => {
                if (!isMounted) return
                setActiveItems(items)
            })
            .catch(() => {
                if (!isMounted) return
                setActiveItemsError("No se pudieron cargar los items disponibles.")
            })
            .finally(() => {
                if (!isMounted) return
                setActiveItemsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [open])






    const handleSubmit = async (data: UserFormData) => {
        try {
            const payload: UserFormData = data

            await onSubmit(payload)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al guardar usuario:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                       Crear Nuevo Usuario
                    </DialogTitle>
                    <DialogDescription>
                        Completa los datos para crear un nuevo usuario.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del servicio" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Nombre *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del usuario" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                                                        <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Apellido *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Apellido del usuario" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="col-span-full">
                                        <FormLabel>Rol</FormLabel>

                                        <FormControl className="col-span-full">
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">Usuario</SelectItem>
                                                    <SelectItem value="admin">Administrador</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-sinergia text-white hover:bg-sinergia-hover">
                                {isLoading
                                    ? "Guardando..."
                                    : "Crear Usuario"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}