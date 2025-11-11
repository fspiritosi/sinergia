"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "./data-table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

// Ejemplo de tipo de datos
type Task = {
    id: string
    title: string
    status: "todo" | "in-progress" | "done" | "canceled"
    priority: "low" | "medium" | "high"
    label: string
}

// Ejemplo de datos
const tasks: Task[] = [
    {
        id: "1",
        title: "Corregir error de autenticación",
        status: "todo",
        priority: "high",
        label: "bug",
    },
    {
        id: "2",
        title: "Agregar nueva funcionalidad",
        status: "in-progress",
        priority: "medium",
        label: "feature",
    },
    // ... más datos
]

// Opciones para filtros
const statuses = [
    { value: "todo", label: "Todo" },
    { value: "in-progress", label: "In Progress" },
    { value: "done", label: "Done" },
    { value: "canceled", label: "Canceled" },
]

const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
]

// Definición de columnas
export const columns: ColumnDef<Task>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "title",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue("title")}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant="outline" className="capitalize">
                    {status}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: "priority",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => {
            const priority = row.getValue("priority") as string
            return (
                <Badge
                    variant={priority === "high" ? "destructive" : "secondary"}
                    className="capitalize"
                >
                    {priority}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <DataTableRowActions
                row={row}
                actions={[
                    {
                        label: "Edit",
                        onClick: (task) => console.log("Edit task:", task),
                    },
                    {
                        label: "Duplicate",
                        onClick: (task) => console.log("Duplicate task:", task),
                    },
                    {
                        label: "Delete",
                        onClick: (task) => console.log("Delete task:", task),
                        variant: "destructive",
                    },
                ]}
            />
        ),
    },
]

// Componente de ejemplo
export function TasksTable() {
    return (
        <div className="container mx-auto py-10">
            <DataTable
                data={tasks}
                columns={columns}
                searchKey="title"
                searchPlaceholder="Filter tasks..."
                filters={[
                    {
                        columnKey: "status",
                        title: "Status",
                        options: statuses,
                    },
                    {
                        columnKey: "priority",
                        title: "Priority",
                        options: priorities,
                    },
                ]}
            />
        </div>
    )
}