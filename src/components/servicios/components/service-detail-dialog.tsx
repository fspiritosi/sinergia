"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Servicio } from "./actions"
import { getItemsService } from "./service-actions"

interface ServiceDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    servicio: Servicio
    onEdit?: () => void
}

type ServicioDetail = Awaited<ReturnType<typeof getItemsService>>

export function ServiceDetailDialog({ open, onOpenChange, servicio, onEdit }: ServiceDetailDialogProps) {
    const [detail, setDetail] = useState<ServicioDetail | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const resolvedServicio = useMemo(() => detail?.servicio ?? servicio, [detail, servicio])

    useEffect(() => {
        if (!open) {
            return
        }

        let isActive = true
        setIsLoading(true)
        setError(null)

        getItemsService(servicio.id)
            .then((data) => {
                if (!isActive) return
                setDetail(data)
            })
            .catch(() => {
                if (!isActive) return
                setError("No se pudieron cargar los items asignados.")
            })
            .finally(() => {
                if (!isActive) return
                setIsLoading(false)
            })

        return () => {
            isActive = false
        }
    }, [open, servicio.id])

    const formatDate = (value: Date | string | null | undefined) => {
        if (!value) return "-"
        const date = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(date.getTime())) return "-"
        return date.toLocaleString("es-AR", {
            dateStyle: "medium",
            timeStyle: "short",
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalle del servicio</DialogTitle>
                    <DialogDescription>
                        Visualiza la información completa del servicio y sus items asignados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <section className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nombre</p>
                                <p className="text-base font-semibold">{resolvedServicio.name}</p>
                            </div>
                            <Badge variant={resolvedServicio.is_active ? "sinergia" : "secondary"}>
                                {resolvedServicio.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Descripción</p>
                            <p className="text-sm leading-relaxed">
                                {resolvedServicio.description || "Sin descripción"}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Creado</p>
                                <p className="text-sm font-medium">{formatDate(resolvedServicio.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Actualizado</p>
                                <p className="text-sm font-medium">{formatDate(resolvedServicio.updatedAt)}</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Items asignados
                            </h3>
                        </div>

                        <div className="rounded-lg border bg-card p-3">
                            {isLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <Skeleton key={index} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : error ? (
                                <p className="text-sm text-destructive">{error}</p>
                            ) : detail && detail.items.length > 0 ? (
                                <ul className="space-y-2">
                                    {detail.items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="rounded-md border border-border px-3 py-2"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{item.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.description || "Sin descripción"}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No hay items asignados a este servicio todavía.
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    {onEdit ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false)
                                onEdit()
                            }}
                        >
                            Editar servicio
                        </Button>
                    ) : null}
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
