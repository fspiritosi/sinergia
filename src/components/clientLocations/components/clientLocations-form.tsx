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
    provinciaId: z.string().min(1, "Provincia requerida"),
    ciudadId: z.string().min(1, "Ciudad requerida"),
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

type Provincia = { id: string; nombre: string }
type Ciudad = { id: string; nombre: string; provinciaId: string }

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
    const [provincias, setProvincias] = useState<Provincia[]>([])
    const [ciudades, setCiudades] = useState<Ciudad[]>([])
    const [loadingCiudades, setLoadingCiudades] = useState(false)
    const [creatingProvincia, setCreatingProvincia] = useState(false)
    const [creatingCiudad, setCreatingCiudad] = useState(false)
    const [newProvinciaNombre, setNewProvinciaNombre] = useState("")
    const [newCiudadNombre, setNewCiudadNombre] = useState("")
    const [inlineError, setInlineError] = useState<string | null>(null)

    const form = useForm<any>({
        resolver: zodResolver(clientLocationSchema),
        defaultValues: {
            name: "",
            clienteId: "",
            provinciaId: "",
            ciudadId: "",
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
                    provinciaId: clientLocation.provinciaId || "",
                    ciudadId: clientLocation.ciudadId || "",
                    is_active: clientLocation.is_active,
                })
            } else {
                form.reset({
                    name: "",
                    clienteId: "",
                    provinciaId: "",
                    ciudadId: "",
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
        if (!open) return
        const loadProvincias = async () => {
            const res = await fetch("/api/provincias")
            const data = await res.json()
            setProvincias(data)
        }
        loadProvincias().catch(console.error)
    }, [open])

    const selectedProvinciaId = form.watch("provinciaId")

    useEffect(() => {
        if (!selectedProvinciaId) {
            setCiudades([])
            form.setValue("ciudadId", "")
            return
        }
        setLoadingCiudades(true)
        fetch(`/api/provincias/${selectedProvinciaId}/ciudades`)
            .then((res) => res.json())
            .then((data: Ciudad[]) => {
                setCiudades(data)
                const current = form.getValues("ciudadId")
                if (!data.find((c) => c.id === current)) {
                    form.setValue("ciudadId", "")
                }
            })
            .catch(console.error)
            .finally(() => setLoadingCiudades(false))
    }, [selectedProvinciaId, form])
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
                                name="provinciaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provincia *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una provincia" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {provincias.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.nombre}
                                                    </SelectItem>
                                                ))}
                                                <div className="border-t p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Nueva provincia"
                                                            value={newProvinciaNombre}
                                                            onChange={(e) => setNewProvinciaNombre(e.target.value)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={async () => {
                                                                if (!newProvinciaNombre.trim()) return
                                                                setInlineError(null)
                                                                setCreatingProvincia(true)
                                                                try {
                                                                    const res = await fetch("/api/provincias", {
                                                                        method: "POST",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ nombre: newProvinciaNombre }),
                                                                    })
                                                                    if (!res.ok) {
                                                                        const err = await res.json().catch(() => ({}))
                                                                        setInlineError(err.error || "No se pudo crear la provincia")
                                                                    } else {
                                                                        const prov: Provincia = await res.json()
                                                                        setProvincias((prev) =>
                                                                            [...prev, prov].sort((a, b) =>
                                                                                a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
                                                                            )
                                                                        )
                                                                        form.setValue("provinciaId", prov.id)
                                                                        setNewProvinciaNombre("")
                                                                        setCiudades([])
                                                                        form.setValue("ciudadId", "")
                                                                    }
                                                                } catch (e) {
                                                                    setInlineError("No se pudo crear la provincia")
                                                                } finally {
                                                                    setCreatingProvincia(false)
                                                                }
                                                            }}
                                                            disabled={creatingProvincia}
                                                        >
                                                            {creatingProvincia ? "Creando..." : "Agregar"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ciudadId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!selectedProvinciaId || loadingCiudades}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            selectedProvinciaId
                                                                ? loadingCiudades
                                                                    ? "Cargando..."
                                                                    : "Selecciona una ciudad"
                                                                : "Selecciona provincia primero"
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ciudades.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nombre}
                                                    </SelectItem>
                                                ))}
                                                <div className="border-t p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Nueva ciudad"
                                                            value={newCiudadNombre}
                                                            onChange={(e) => setNewCiudadNombre(e.target.value)}
                                                            disabled={!selectedProvinciaId}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            disabled={!selectedProvinciaId || creatingCiudad}
                                                            onClick={async () => {
                                                                if (!selectedProvinciaId || !newCiudadNombre.trim()) return
                                                                setInlineError(null)
                                                                setCreatingCiudad(true)
                                                                try {
                                                                    const res = await fetch(
                                                                        `/api/provincias/${selectedProvinciaId}/ciudades`,
                                                                        {
                                                                            method: "POST",
                                                                            headers: { "Content-Type": "application/json" },
                                                                            body: JSON.stringify({ nombre: newCiudadNombre }),
                                                                        }
                                                                    )
                                                                    if (!res.ok) {
                                                                        const err = await res.json().catch(() => ({}))
                                                                        setInlineError(err.error || "No se pudo crear la ciudad")
                                                                    } else {
                                                                        const ciudad: Ciudad = await res.json()
                                                                        setCiudades((prev) =>
                                                                            [...prev, ciudad].sort((a, b) =>
                                                                                a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
                                                                            )
                                                                        )
                                                                        form.setValue("ciudadId", ciudad.id)
                                                                        setNewCiudadNombre("")
                                                                    }
                                                                } catch (e) {
                                                                    setInlineError("No se pudo crear la ciudad")
                                                                } finally {
                                                                    setCreatingCiudad(false)
                                                                }
                                                            }}
                                                        >
                                                            {creatingCiudad ? "Creando..." : "Agregar"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </SelectContent>
                                        </Select>
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