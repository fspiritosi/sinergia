"use client"

import { getClientes } from "@/components/clientes/components/actions"
import { getActiveServicios } from "@/components/servicios/components/actions"
import { getItemsService } from "@/components/servicios/components/service-actions"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Cliente, Items, Servicio } from "@/generated/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { PropuestaTecnica } from "./actions"



const MONEDA_OPTIONS = ["ARS", "USD", "EUR"] as const
const monedaEnum = z.enum(MONEDA_OPTIONS)
type MonedaValue = z.infer<typeof monedaEnum>

const STATUS_OPTIONS = [
    "pendiente",
    "aprobada",
    "rechazada",
    "en_progreso",
    "finalizada",
] as const
const statusEnum = z.enum(STATUS_OPTIONS)
type StatusValue = z.infer<typeof statusEnum>

const propuestaSchema = z.object({
    codigo: z.string().min(1, "El código es requerido"),
    clienteId: z.string().min(1, "Seleccioná un cliente"),
    servicioId: z.string().min(1, "Seleccioná un servicio"),
    vigencia: z
        .string()
        .min(1, "La vigencia es requerida")
        .refine((value) => !Number.isNaN(new Date(value).getTime()), {
            message: "Ingresá una fecha válida",
        }),
    items: z.array(z.string()).min(1, "Seleccioná al menos un item"),
    contacto: z.string().optional(),
    valor: z
        .string()
        .min(1, "El valor es requerido")
        .refine((value) => !Number.isNaN(Number(value)), {
            message: "Ingresá un número válido",
        })
        .refine((value) => Number(value) >= 0, {
            message: "El valor debe ser mayor o igual a 0",
        }),
    moneda: monedaEnum,
    status: statusEnum,
})

type PropuestaFormData = z.infer<typeof propuestaSchema>

const formatDateForInput = (date?: string | Date | null) => {
    if (!date) {
        return ""
    }

    const parsedDate = typeof date === "string" ? new Date(date) : date

    if (Number.isNaN(parsedDate.getTime())) {
        return ""
    }

    return parsedDate.toISOString().split("T")[0]
}

interface PropuestaFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propuesta?: PropuestaTecnica | null
    onSubmit: (data: any) => Promise<void>
    isLoading?: boolean
}

export function PropuestaForm({
    open,
    onOpenChange,
    propuesta,
    onSubmit,
    isLoading = false,
}: PropuestaFormProps) {
    const isEditing = !!propuesta

    const form = useForm<PropuestaFormData>({
        resolver: zodResolver(propuestaSchema),
        defaultValues: {
            codigo: "",
            clienteId: "",
            servicioId: "",
            vigencia: "",
            items: [],
            contacto: "",
            valor: "",
            moneda: MONEDA_OPTIONS[0],
            status: STATUS_OPTIONS[0],
        },
    })

    const [clientes, setClientes] = useState<Cliente[]>([])
    const [clientesLoading, setClientesLoading] = useState(false)
    const [clientesError, setClientesError] = useState<string | null>(null)

    const [servicios, setServicios] = useState<Servicio[]>([])
    const [serviciosLoading, setServiciosLoading] = useState(false)
    const [serviciosError, setServiciosError] = useState<string | null>(null)

    const [servicioItems, setServicioItems] = useState<Items[]>([])
    const [itemsLoading, setItemsLoading] = useState(false)
    const [itemsError, setItemsError] = useState<string | null>(null)

    const selectedServicioId = form.watch("servicioId")

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (open) {
            if (propuesta) {
                form.reset({
                    codigo: propuesta.codigo,
                    clienteId: propuesta.clienteId,
                    servicioId: propuesta.servicioId,
                    vigencia: formatDateForInput(propuesta.vigencia),
                    items: propuesta.items,
                    contacto: propuesta.contacto ?? "",
                    valor: propuesta.valor?.toString() ?? "",
                    moneda: (propuesta.moneda as MonedaValue | null) ?? MONEDA_OPTIONS[0],
                    status: (propuesta.status as StatusValue | null) ?? STATUS_OPTIONS[0],
                })
            } else {
                form.reset({
                    codigo: "",
                    clienteId: "",
                    servicioId: "",
                    vigencia: "",
                    items: [],
                    contacto: "",
                    valor: "",
                    moneda: MONEDA_OPTIONS[0],
                    status: STATUS_OPTIONS[0],
                })
            }
        }
    }, [open, propuesta, form])

    useEffect(() => {
        if (!open) {
            return
        }

        let isMounted = true

        const loadClientesYServicios = async () => {
            setClientesLoading(true)
            setServiciosLoading(true)
            setClientesError(null)
            setServiciosError(null)

            try {
                const [clientesResponse, serviciosResponse] = await Promise.all([
                    getClientes(),
                    getActiveServicios(),
                ])

                if (isMounted) {
                    const activeClientes = clientesResponse.filter((cliente) => cliente.is_active)
                    const activeServicios = serviciosResponse.filter((servicio) => servicio.is_active)

                    if (propuesta) {
                        const selectedCliente = clientesResponse.find((cliente) => cliente.id === propuesta.clienteId)
                        if (selectedCliente && !selectedCliente.is_active) {
                            activeClientes.push(selectedCliente)
                        }

                        const selectedServicio = serviciosResponse.find((servicio) => servicio.id === propuesta.servicioId)
                        if (selectedServicio && !selectedServicio.is_active) {
                            activeServicios.push(selectedServicio)
                        }
                    }

                    const uniqueClientes = Array.from(new Map(activeClientes.map((cliente) => [cliente.id, cliente])).values())
                    const uniqueServicios = Array.from(new Map(activeServicios.map((servicio) => [servicio.id, servicio])).values())

                    setClientes(uniqueClientes)
                    setServicios(uniqueServicios)
                }
            } catch (error) {
                console.error("Error al cargar clientes o servicios:", error)
                if (isMounted) {
                    setClientesError("No se pudieron cargar los clientes.")
                    setServiciosError("No se pudieron cargar los servicios.")
                }
            } finally {
                if (isMounted) {
                    setClientesLoading(false)
                    setServiciosLoading(false)
                }
            }
        }

        void loadClientesYServicios()

        return () => {
            isMounted = false
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            return
        }

        if (!selectedServicioId) {
            setServicioItems([])
            setItemsError(null)
            setItemsLoading(false)
            if (form.getValues("items").length) {
                form.setValue("items", [], { shouldDirty: true, shouldValidate: true })
            }
            return
        }

        let isMounted = true
        setItemsLoading(true)
        setItemsError(null)

        getItemsService(selectedServicioId)
            .then(({ items }) => {
                if (!isMounted) return
                const activos = items.filter((item) => item.is_active)
                setServicioItems(activos)

                const currentItems = form.getValues("items")
                const filteredItems = currentItems.filter((itemId) => activos.some((item) => item.id === itemId))
                const nextItems = filteredItems.length > 0 ? filteredItems : activos.map((item) => item.id)

                form.setValue("items", nextItems, { shouldDirty: true, shouldValidate: true })
            })
            .catch((error) => {
                console.error("Error al cargar items del servicio:", error)
                if (!isMounted) return
                setItemsError("No se pudieron cargar los items del servicio seleccionado.")
                setServicioItems([])
                form.setValue("items", [], { shouldDirty: true, shouldValidate: true })
            })
            .finally(() => {
                if (!isMounted) return
                setItemsLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [open, selectedServicioId, form])

    const servicioSeleccionado = useMemo(
        () => servicios.find((servicio) => servicio.id === selectedServicioId),
        [servicios, selectedServicioId]
    )

    const handleSubmit = async (data: PropuestaFormData) => {
        const normalizedDate = new Date(data.vigencia)
        const payload = {
            ...data,
            valor: Number(data.valor),
            vigencia: Number.isNaN(normalizedDate.getTime())
                ? null
                : normalizedDate.toISOString(),
            is_active: propuesta?.is_active ?? true,
        }

        try {
            await onSubmit(payload)
            onOpenChange(false)
        } catch (error) {
            console.error("Error al guardar propuesta:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Propuesta" : "Crear Nueva Propuesta"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos de la propuesta."
                            : "Completa los datos para crear una nueva propuesta."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="codigo"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Codigo *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Codigo de la propuesta" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="vigencia"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Vigencia *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                placeholder="Seleccioná una fecha"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
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
                                name="servicioId"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Servicio *</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={(value) => field.onChange(value)}
                                                value={field.value || undefined}
                                                disabled={serviciosLoading || !!serviciosError}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={
                                                        serviciosLoading
                                                            ? "Cargando servicios..."
                                                            : "Seleccioná un servicio"
                                                    } />
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
                                        {serviciosError ? (
                                            <p className="text-sm text-destructive">{serviciosError}</p>
                                        ) : null}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contacto"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del contacto" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="valor"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 sm:col-span-1">
                                        <FormLabel>Valor *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Ingresá el valor"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="moneda"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 sm:col-span-1">
                                        <FormLabel>Moneda *</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccioná una moneda" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MONEDA_OPTIONS.map((moneda) => (
                                                        <SelectItem key={moneda} value={moneda}>
                                                            {moneda}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {isEditing && (<FormField
                                control={form.control}
                                name="status"

                                render={({ field }) => (
                                    <FormItem className="col-span-2 sm:col-span-1">
                                        <FormLabel>Estado *</FormLabel>
                                        <FormControl>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccioná un estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status} value={status} className="capitalize">
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />)}


                            <FormField
                                control={form.control}
                                name="items"
                                render={({ field }) => {
                                    const selectedItems = field.value ?? []

                                    return (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Items *</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3 rounded-md border border-border p-3">
                                                    {!selectedServicioId ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            Seleccioná un servicio para ver sus items disponibles.
                                                        </p>
                                                    ) : itemsLoading ? (
                                                        <p className="text-sm text-muted-foreground">Cargando items...</p>
                                                    ) : itemsError ? (
                                                        <p className="text-sm text-destructive">{itemsError}</p>
                                                    ) : servicioItems.length ? (
                                                        <div className="space-y-2">
                                                            {servicioItems.map((item) => {
                                                                const checked = selectedItems.includes(item.id)
                                                                return (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                                                                    >
                                                                        <div className="flex flex-1 items-start gap-2">
                                                                            <Checkbox
                                                                                checked={checked}
                                                                                onCheckedChange={(value) => {
                                                                                    if (value === true) {
                                                                                        field.onChange([
                                                                                            ...selectedItems,
                                                                                            item.id,
                                                                                        ])
                                                                                        return
                                                                                    }

                                                                                    field.onChange(
                                                                                        selectedItems.filter((id) => id !== item.id)
                                                                                    )
                                                                                }}
                                                                            />
                                                                            <div>
                                                                                <p className="text-sm font-medium">{item.name}</p>
                                                                                {item.description ? (
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {item.description}
                                                                                    </p>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            {servicioSeleccionado
                                                                ? `El servicio "${servicioSeleccionado.name}" no tiene items asociados activos.`
                                                                : "No hay items disponibles para el servicio seleccionado."}
                                                        </p>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )
                                }}
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
                                        : "Crear Propuesta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}