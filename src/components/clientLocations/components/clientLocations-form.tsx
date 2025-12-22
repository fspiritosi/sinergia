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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { clientLocations } from "./actions"
import { getClientes, type Cliente } from "@/components/clientes/components/actions"
import { useEffect, useState } from "react"


const clientLocationSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    clienteId: z.string().min(1, "El cliente es requerido"),
    is_active: z.boolean(),
})

type ClientLocationFormData = z.infer<typeof clientLocationSchema>

interface ClientLocationFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientLocation?: clientLocations | null
    onSubmit: (data: any) => Promise<void>
    isLoading?: boolean
}

export function ClientLocationForm({
    open,
    onOpenChange,
    clientLocation,
    onSubmit,
    isLoading = false,
}:  ClientLocationFormProps) {
    const isEditing = !!clientLocation

    const [clientes, setClientes] = useState<Cliente[]>([])
    const [clientesLoading, setClientesLoading] = useState(false)
    const [clientesError, setClientesError] = useState<string | null>(null)

    const form = useForm<any>({
        resolver: zodResolver(clientLocationSchema),
        defaultValues: {
            name: "",
            clienteId: "",
            is_active: true,
        },
    })

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (open) {
            if (clientLocation) {
                form.reset({
                    name: clientLocation.name,
                    clienteId: clientLocation.cliente.id,
                    is_active: clientLocation.is_active,
                })
            } else {
                form.reset({
                    name: "",
                    clienteId: "",
                    is_active: true,
                })
            }
        }
    }, [open, clientLocation, form])

    // Cargar clientes cuando se abre el modal
    useEffect(() => {
        if (!open) {
            return
        }

        let isMounted = true

        const loadClientes = async () => {
            setClientesLoading(true)
            setClientesError(null)

            try {
                const clientesResponse = await getClientes()
                if (!isMounted) return

                const activeClientes = clientesResponse.filter((cliente) => cliente.is_active)
                setClientes(activeClientes)
            } catch (error) {
                console.error("Error al cargar clientes:", error)
                if (!isMounted) return
                setClientesError("No se pudieron cargar los clientes.")
            } finally {
                if (!isMounted) return
                setClientesLoading(false)
            }
        }

        loadClientes()

        return () => {
            isMounted = false
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            return
        }
          let isMounted = true

    },[])
    const handleSubmit = async (data: any) => {
        try {
            await onSubmit(data)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al guardar locacion:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Locacion" : "Crear Nueva Locacion"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos de la locacion."
                            : "Completa los datos para crear una nueva locacion."}
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
                                            <Input placeholder="Nombre de la locacion" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                                        <FormField
                                control={form.control}
                                name="clienteId"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Cliente *</FormLabel>
                                        <FormControl className="w-full">
                                            <Select
                                                onValueChange={(value) => field.onChange(value)}
                                                value={field.value || undefined}
                                                disabled={clientesLoading || !!clientesError}

                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        clientesLoading
                                                            ? "Cargando clientes..."
                                                            : "Seleccioná un cliente"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clientes.map((cliente) => (
                                                        <SelectItem key={cliente.id} value={cliente.id}>
                                                            {cliente.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        {clientesError ? (
                                            <p className="text-sm text-destructive">{clientesError}</p>
                                        ) : null}
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
                                                Tipo activo
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
                                        : "Crear Locación"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}