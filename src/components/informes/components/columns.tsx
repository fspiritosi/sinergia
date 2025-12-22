"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import { InformeRowActions } from "./informe-row-actions"
import { Informe } from "./actions"
import { formatDateOnly } from "@/lib/dates"

export const columns: ColumnDef<Informe>[] = [
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
    accessorFn: (row) => row.cliente?.name,
    id: "clienteNombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-medium">
          {row.original.cliente?.name || 'Sin cliente'}
        </span>
      </div>
    ),
  },
  {
    accessorFn: (row) => row.tipoDeInforme?.name,
    id: "tipoDeInformeNombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo de Informe" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate text-sm text-muted-foreground">
          {row.original.tipoDeInforme?.name || 'Sin tipo'}
        </span>
      </div>
    ),
  },
  {
    accessorFn: (row) => row.clientLocation?.name,
    id: "locacionNombre",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Locación" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate text-sm text-muted-foreground">
          {row.original.clientLocation?.name || 'Sin locación'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "fechaVencimiento",
    id: "fechaVencimiento",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha de Vencimiento" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDateOnly(row.getValue("fechaVencimiento") as any, "es-AR")}
        </div>
      )
    },
  },
  {
    accessorKey: "estado",
    id: "estado",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const estado = row.original.estado
      const isPendiente = estado === "pendiente"
      return (
        <Badge variant={isPendiente ? "sinergia" : "secondary"}>
          {isPendiente ? "Pendiente" : "Entregado"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <InformeRowActions informe={row.original} />
    },
  },
]
