"use client"

import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ColumnDef } from "@tanstack/react-table"
import type { PropuestaTecnica } from "./actions"
import { PropuestaRowActions } from "./propuesta-row-actions"

export const columns: ColumnDef<PropuestaTecnica>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Seleccionar todo"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "codigo",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Código" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue("codigo")}
                    </span>
                </div>
            )
        },
    },
    {
        accessorFn: (row) => row.cliente?.name ?? "",
        id: "clienteNombre",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.original.cliente?.name ?? "Sin cliente"}
                    </span>
                </div>
            )
        },
    },
    {
        accessorFn: (row) => row.servicios?.name ?? "",
        id: "servicioNombre",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Servicio" />
        ),
        cell: ({ row }) => {
            const servicioNombre = row.original.servicios?.name ?? "Sin servicio"
            return (
                <div className="text-sm">
                    {servicioNombre}
                </div>
            )
        },
    },
    {
        accessorFn: (row) => row.servicios?.type ?? "",
        id: "servicioTipo",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
            const servicioTipo = row.original.servicios?.type ?? "Sin tipo"
            return (
                <div className="text-sm capitalize">
                    {servicioTipo}
                </div>
            )
        },
    },
    {
        accessorKey: "contacto",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Contacto" />
        ),
        cell: ({ row }) => {
            const contacto = row.original.contacto
            return (
                <div className="text-sm">
                    {contacto || "-"}
                </div>
            )
        },
    },
    {
        id: "status",
        accessorFn: (row) => String(row.status),
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
            const status = row.original.status
            return (
                <Badge variant={
                    status === "aprobada" ? "sinergia" 
                    : status === "rechazada" ? "destructive" 
                    : status === "pendiente" ? "warning" 
                    : "secondary"}>
                    {status}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "vigencia",
        accessorFn: (row) => row.vigencia ? new Date(row.vigencia).toLocaleDateString() : "",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Vigencia" />
        ),
        cell: ({ row }) => {
            const vigencia = row.original.vigencia
            return vigencia ? new Date(vigencia).toLocaleDateString() : "-"
        },
    },

    {
        id: "valor",
        accessorFn: (row) => row.valor,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Valor" />
        ),
        cell: ({ row }) => {
            const valor = row.original.valor
            const moneda = row.original.moneda ?? "ARS"

            if (!Number.isFinite(valor)) {
                return "-"
            }

            return valor.toLocaleString("es-AR", {
                style: "currency",
                currency: moneda,
            })
        },
    },

    {
        accessorKey: "moneda",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Moneda" />
        ),
        cell: ({ row }) => {
            const moneda = row.original.moneda ?? "-"
            return <Badge variant="outline">{moneda}</Badge>
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Fecha de Creación" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"))
            return (
                <div className="text-sm text-muted-foreground">
                    {date.toLocaleDateString("es-AR")}
                </div>
            )
        },
        filterFn: (row, id, value) => {
            const date = new Date(row.getValue(id))
            const now = new Date()

            return value.some((filterValue: string) => {
                switch (filterValue) {
                    case "today":
                        return date.toDateString() === now.toDateString()
                    case "week":
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                        return date >= weekAgo
                    case "month":
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                        return date >= monthAgo
                    case "quarter":
                        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
                        return date >= quarterAgo
                    case "year":
                        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                        return date >= yearAgo
                    default:
                        return true
                }
            })
        },
    },

    {
        id: "actions",
        cell: ({ row }) => {
            return <PropuestaRowActions propuesta={row.original} />
        },
    },
]