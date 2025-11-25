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
import { Switch } from "@/components/ui/switch"
import { Servicio } from "./actions"
import { useEffect, useMemo, useState } from "react"
import { getItemsService } from "../../servicios/components/service-actions"
import { getActiveItems } from "@/components/items/components/actions"
import { Items } from "@/generated/client"
import { X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"


const serviceSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().min(1, "La descripción es requerida"),
    is_active: z.boolean(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

export type ServiceFormSubmitData = ServiceFormData & {
    itemIdsToKeep?: string[]
}

interface ServiceFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void   
    servicio?: Servicio | null    
    onSubmit: (data: ServiceFormSubmitData) => Promise<void>
    isLoading?: boolean
}

export function ServiceForm({
    open,
    onOpenChange,
    servicio,
    onSubmit,
    isLoading = false,
}: ServiceFormProps) {
    const isEditing = !!servicio
    const [assignedItems, setAssignedItems] = useState<Items[]>([])
    const [itemsLoading, setItemsLoading] = useState(false)
    const [itemsError, setItemsError] = useState<string | null>(null)
    const [activeItems, setActiveItems] = useState<Items[]>([])
    const [activeItemsLoading, setActiveItemsLoading] = useState(false)
    const [activeItemsError, setActiveItemsError] = useState<string | null>(null)
    const [isAddingItems, setIsAddingItems] = useState(false)
    const [selectedNewItemIds, setSelectedNewItemIds] = useState<string[]>([])

    const form = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: "",
            description: "",
            is_active: true,
        },
    })

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (open) {
            if (servicio) {
                form.reset({
                    name: servicio.name,
                    description: servicio.description,
                    is_active: servicio.is_active,
                })
            } else {
                form.reset({
                    name: "",
                    description: "",
                    is_active: true,
                })
            }   
        }
    }, [open, servicio, form])

    useEffect(() => {
        if (!open || !isEditing || !servicio?.id) {
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

        getItemsService(servicio.id)
            .then(({ items }) => {
                if (!isMounted) return
                setAssignedItems(items)
            })
            .catch(() => {
                if (!isMounted) return
                setItemsError("No se pudieron cargar los items asignados.")
            })
            .finally(() => {
                if (!isMounted) return
                setItemsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [open, isEditing, servicio?.id])

    useEffect(() => {
        if (!open || !isEditing) {
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
    }, [open, isEditing])

    const availableItems = useMemo(
        () =>
            activeItems.filter(
                (item) => !assignedItems.some((assignedItem) => assignedItem.id === item.id)
            ),
        [activeItems, assignedItems]
    )

    const handleRemoveItem = (itemId: string) => {
        setAssignedItems((prev) => prev.filter((item) => item.id !== itemId))
    }

    const handleToggleNewItem = (itemId: string, checked: boolean) => {
        setSelectedNewItemIds((prev) => {
            if (checked) {
                return [...prev, itemId]
            }

            return prev.filter((id) => id !== itemId)
        })
    }

    const handleAddSelectedItems = () => {
        if (!selectedNewItemIds.length) return

        setAssignedItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const itemsToAdd = availableItems.filter((item) =>
                selectedNewItemIds.includes(item.id)
            )

            const mergedItems = [...prev]

            itemsToAdd.forEach((item) => {
                if (!existingIds.has(item.id)) {
                    mergedItems.push(item)
                }
            })

            return mergedItems
        })

        setSelectedNewItemIds([])
        setIsAddingItems(false)
    }

    const handleSubmit = async (data: ServiceFormData) => {
        try {
            const payload: ServiceFormSubmitData = isEditing
                ? { ...data, itemIdsToKeep: assignedItems.map((item) => item.id) }
                : data

            await onSubmit(payload)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al guardar servicio:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Servicio" : "Crear Nuevo Servicio"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos del servicio."
                            : "Completa los datos para crear un nuevo servicio."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Nombre *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del servicio" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Descripción *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Descripción del servicio" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Estado</FormLabel>
                                            <div className="text-sm text-muted-foreground">
                                                Servicio activo
                                            </div>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {isEditing && (
                                <div className="col-span-2 space-y-3">
                                    <FormLabel>Items asignados</FormLabel>
                                    {itemsLoading ? (
                                        <div className="space-y-2">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <Skeleton key={index} className="h-10 w-full" />
                                            ))}
                                        </div>
                                    ) : itemsError ? (
                                        <p className="text-sm text-destructive">{itemsError}</p>
                                    ) : assignedItems.length ? (
                                        <div className="space-y-2">
                                            {assignedItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                                                >
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No hay items asignados a este servicio.
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setIsAddingItems((prev) => !prev)}
                                            disabled={activeItemsLoading || !!activeItemsError}
                                        >
                                            {isAddingItems ? "Cancelar" : "Agregar items"}
                                        </Button>
                                        {activeItemsError && (
                                            <p className="text-sm text-destructive">{activeItemsError}</p>
                                        )}
                                    </div>
                                    {isAddingItems && (
                                        <div className="space-y-3 rounded-md border border-border p-3">
                                            {activeItemsLoading ? (
                                                <div className="space-y-2">
                                                    {Array.from({ length: 3 }).map((_, index) => (
                                                        <Skeleton key={index} className="h-10 w-full" />
                                                    ))}
                                                </div>
                                            ) : availableItems.length ? (
                                                <div className="space-y-2">
                                                    {availableItems.map((item) => {
                                                        const isChecked = selectedNewItemIds.includes(item.id)

                                                        return (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) =>
                                                                            handleToggleNewItem(item.id, checked === true)
                                                                        }
                                                                    />
                                                                    <span className="text-sm font-medium">{item.name}</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    No hay items activos disponibles para agregar.
                                                </p>
                                            )}
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedNewItemIds([])
                                                        setIsAddingItems(false)
                                                    }}
                                                >
                                                    Cerrar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handleAddSelectedItems}
                                                    disabled={!selectedNewItemIds.length}
                                                >
                                                    Agregar seleccionados
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Los cambios se aplicarán al guardar el servicio.
                                    </p>
                                </div>
                            )}
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
                                    : isEditing
                                        ? "Actualizar"
                                        : "Crear Servicio"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}