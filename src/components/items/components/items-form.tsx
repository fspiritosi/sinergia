"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Item } from "./actions"
import { getServiciosByItem, ServicioAssignment } from "./items-actions"




const itemSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().min(1, "La descripción es requerida"),
    is_active: z.boolean(),

})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: Item | null
    onSubmit: (data: any) => Promise<void>
    isLoading?: boolean
}

export function ItemForm({
    open,
    onOpenChange,
    item,
    onSubmit,
    isLoading = false,
}: ItemFormProps) {
    const isEditing = !!item

    const form = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            name: "",
            description: "",
            is_active: true,

        },
    })

    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
    const [associatedServicios, setAssociatedServicios] = useState<ServicioAssignment[]>([])
    const [serviciosLoading, setServiciosLoading] = useState(false)
    const [serviciosError, setServiciosError] = useState<string | null>(null)
    const [hasConfirmedDeactivation, setHasConfirmedDeactivation] = useState(false)

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (open) {
            if (item) {
                form.reset({
                    name: item.name,
                    description: item.description,
                    is_active: item.is_active,
                } as any)
            } else {
                form.reset({
                    name: "",
                    description: "",
                    is_active: true,

                })
            }
        } else {
            setShowDeactivateConfirm(false)
            setAssociatedServicios([])
            setServiciosError(null)
            setServiciosLoading(false)
            setHasConfirmedDeactivation(false)
        }
    }, [open, item, form])

    const loadAssociatedServicios = async () => {
        if (!item?.id) {
            setAssociatedServicios([])
            return
        }

        setServiciosLoading(true)
        setServiciosError(null)

        try {
            const servicios = await getServiciosByItem(item.id)
            setAssociatedServicios(servicios)
        } catch (error) {
            console.error("Error al obtener servicios asociados:", error)
            setServiciosError("No se pudieron cargar los servicios asociados al item.")
        } finally {
            setServiciosLoading(false)
        }
    }

    const handleConfirmDeactivate = () => {
        setHasConfirmedDeactivation(true)
        form.setValue("is_active", false, { shouldDirty: true })
        setShowDeactivateConfirm(false)
    }



    const handleSubmit = async (data: any) => {
        try {
            await onSubmit(data)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al guardar item:", error)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Editar Item" : "Crear Nuevo Item"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Modifica los datos del item."
                                : "Completa los datos para crear un nuevo item."}
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
                                                <Input placeholder="Nombre del item" {...field} />
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
                                                <Input placeholder="Descripción del item" {...field} />
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



                                <FormField
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
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setHasConfirmedDeactivation(false)
                                                            field.onChange(true)
                                                            return
                                                        }

                                                        if (!isEditing) {
                                                            field.onChange(false)
                                                            return
                                                        }

                                                        const currentValue = form.getValues("is_active")

                                                        if (!item?.is_active || hasConfirmedDeactivation || !currentValue) {
                                                            field.onChange(false)
                                                            return
                                                        }

                                                        field.onChange(true)
                                                        setShowDeactivateConfirm(true)
                                                        setAssociatedServicios([])
                                                        void loadAssociatedServicios()
                                                    }}
                                                />
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
                                        : isEditing
                                            ? "Actualizar"
                                            : "Crear Item"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeactivateConfirm} onOpenChange={(value) => {
                setShowDeactivateConfirm(value)
                if (!value && form.getValues("is_active") === true && !hasConfirmedDeactivation) {
                    // Mantener el switch en verdadero cuando se cierra sin confirmar
                    form.setValue("is_active", true, { shouldDirty: true })
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Desactivar item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Al desactivar este item se eliminará su asignación de los servicios listados a continuación.
                            ¿Deseás continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                        {serviciosLoading ? (
                            <p className="text-sm text-muted-foreground">Cargando servicios asociados...</p>
                        ) : serviciosError ? (
                            <p className="text-sm text-destructive">{serviciosError}</p>
                        ) : associatedServicios.length ? (
                            <ul className="space-y-2">
                                {associatedServicios.map((servicio) => (
                                    <li key={servicio.id} className="text-sm">
                                        <p className="font-medium">{servicio.name}</p>
                                        {servicio.description ? (
                                            <p className="text-xs text-muted-foreground">{servicio.description}</p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Este item no se encuentra asignado a servicios activos actualmente.
                            </p>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeactivateConfirm(false)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeactivate} disabled={serviciosLoading}>
                            Desactivar item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}