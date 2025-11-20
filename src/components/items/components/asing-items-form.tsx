"use client"

import { getActiveServicios } from "@/components/servicios/components/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Servicio } from "@/generated/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { getActiveItems, Item } from "./actions"





const itemSchema = z.object({
    selectedItemIds: z.array(z.string()).min(1, "Seleccione al menos un item"),
    servicio: z.string().min(1, "El servicio es requerido"),
})

export type AssignItemsFormValues = z.infer<typeof itemSchema>

interface ItemFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: Item | null
    onSubmit: (data: AssignItemsFormValues) => Promise<void>
    isLoading?: boolean
}

export function AsignItemForm({
    open,
    onOpenChange,
    item,
    onSubmit,
    isLoading = false,
}: ItemFormProps) {


    const form = useForm<AssignItemsFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            selectedItemIds: item ? [item.id] : [],
            servicio: "",
        },
    })



    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (open) {
            form.reset({
                selectedItemIds: item ? [item.id] : [],
                servicio: "",
            })
        }
    }, [open, item, form])

    const [items, setItems] = useState<Item[]>([])
    const [servicios, setServicios] = useState<Servicio[]>([])

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await getActiveItems()
                setItems(response as any)
            } catch (error) {
                console.error("Error al obtener items:", error)
            }
        }

        fetchItems()
    }, [])

    useEffect(() => {
        const fetchServicios = async () => {
            try {
                const response = await getActiveServicios()
                setServicios(response)
            } catch (error) {
                console.error("Error al obtener servicios:", error)
            }
        }
        fetchServicios()
    }, [])


    const handleSubmit = async (data: AssignItemsFormValues) => {
        try {
            await onSubmit(data)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al asignar items:", error)
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        Asignar Item
                    </DialogTitle>
                    <DialogDescription>
                        Completa los datos para asignar un item.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="selectedItemIds"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Items *</FormLabel>
                                        <div className="space-y-2">
                                            {items.map((item) => {
                                                const currentValue = field.value ?? []
                                                const isChecked = currentValue.includes(item.id)

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center space-x-2 rounded-md border p-2"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => {
                                                                    const value = field.value ?? []
                                                                    if (checked === true) {
                                                                        field.onChange([...value, item.id])
                                                                    } else {
                                                                        field.onChange(value.filter((selectedId) => selectedId !== item.id))
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <span className="text-sm">{item.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="servicio"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Servicio *</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un servicio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicios.map((servicio) => (
                                                        <SelectItem key={servicio.id} value={servicio.id}>
                                                            {servicio.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Descripción *</FormLabel>
                                        <FormControl>
                                            <Select {...field}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un servicio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicios.map((servicio) => (
                                                        <SelectItem key={servicio.id} value={servicio.id}>
                                                            {servicio.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> */}



                            {/* <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel>Estado</FormLabel>
                                            <div className="text-sm text-muted-foreground">
                                                Item activo
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
                            /> */}
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
                                    : "Asignar Item"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}