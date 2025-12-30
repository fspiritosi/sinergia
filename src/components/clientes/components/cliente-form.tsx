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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Cliente } from "./actions"
import { useEffect, useState } from "react"


const clienteSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    cuit: z.string().min(11, "El CUIT debe tener al menos 11 caracteres"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    domicilio: z.string().optional(),
    provinciaId: z.string().min(1, "Provincia requerida"),
    ciudadId: z.string().min(1, "Ciudad requerida"),
   // moneda: z.enum(["ARS", "USD"]),
    is_active: z.boolean(),
})

type ClienteFormData = z.infer<typeof clienteSchema>

interface ClienteFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cliente?: Cliente | null
    onSubmit: (data: any) => Promise<void>
    isLoading?: boolean
}

type Provincia = { id: string; nombre: string }
type Ciudad = { id: string; nombre: string; provinciaId: string }

export function ClienteForm({
    open,
    onOpenChange,
    cliente,
    onSubmit,
    isLoading = false,
}: ClienteFormProps) {
    const isEditing = !!cliente
    const [provincias, setProvincias] = useState<Provincia[]>([])
    const [ciudades, setCiudades] = useState<Ciudad[]>([])
    const [loadingCiudades, setLoadingCiudades] = useState(false)
    const [creatingProvincia, setCreatingProvincia] = useState(false)
    const [creatingCiudad, setCreatingCiudad] = useState(false)
    const [newProvinciaNombre, setNewProvinciaNombre] = useState("")
    const [newCiudadNombre, setNewCiudadNombre] = useState("")
    const [inlineError, setInlineError] = useState<string | null>(null)

    const form = useForm<any>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            name: "",
            cuit: "",
            email: "",
            telefono: "",
            domicilio: "",
            provinciaId: "",
            ciudadId: "",
           // moneda: "ARS",
            is_active: true,
        },
    })

    // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
    useEffect(() => {
        if (!open) return

        const loadProvincias = async () => {
            const res = await fetch("/api/provincias")
            const data = await res.json()
            setProvincias(data)
        }
        loadProvincias().catch(console.error)
    }, [open])

    useEffect(() => {
        if (!open) return
        if (cliente) {
            form.reset({
                name: cliente.name,
                cuit: cliente.cuit,
                email: cliente.email || "",
                telefono: cliente.telefono || "",
                domicilio: cliente.domicilio || "",
                provinciaId: cliente.provinciaId || "",
                ciudadId: cliente.ciudadId || "",
                //moneda: cliente.moneda,
                is_active: cliente.is_active,
            })
        } else {
            form.reset({
                name: "",
                cuit: "",
                email: "",
                telefono: "",
                domicilio: "",
                provinciaId: "",
                ciudadId: "",
                //moneda: "ARS",
                is_active: true,
            })
        }
    }, [open, cliente, form])

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
                // If current ciudadId not in list, reset
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
            console.error("Error al guardar cliente:", error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Cliente" : "Crear Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos del cliente."
                            : "Completa los datos para crear un nuevo cliente."}
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
                                            <Input placeholder="Nombre del cliente" {...field} />
                                        </FormControl>
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
                                name="cuit"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>CUIT *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="20-12345678-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="cliente@ejemplo.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+54 11 1234-5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="domicilio"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dirección completa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* <FormField
                                control={form.control}
                                name="moneda"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Moneda *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar moneda" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                                                <SelectItem value="USD">Dólares (USD)</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                                Cliente activo
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
                                        : "Crear Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}