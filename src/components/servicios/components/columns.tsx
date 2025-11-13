"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { ServiceRowActions } from "./service-row-actions"
import { Servicio } from "./actions"

export const columns: ColumnDef<Servicio>[] = [
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
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue("name")}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "description",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Descripción" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue("description")}
                    </span>
                </div>
            )
        }
    },
        {
        id: "is_active",
        accessorFn: (row) => String(row.is_active),
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
            const isActive = row.original.is_active
            return (
                <Badge variant={isActive ? "sinergia" : "secondary"}>
                    {isActive ? "Activo" : "Inactivo"}
                </Badge>
            )
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
            return <ServiceRowActions servicio={row.original} />
        },
    },
]