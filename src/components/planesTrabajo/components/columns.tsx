"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header"
import type { PlanTrabajoListItem } from "./actions"
import { formatDateOnly } from "@/lib/dates"

function formatEstado(value: string): string {
  switch (value) {
    case "pendiente_programacion":
      return "Pendiente de Programación"
    case "programado_incompleto":
      return "Programado incompleto"
    case "programado_completo":
      return "Programado completo"
    case "en_desarrollo":
      return "En desarrollo"
    case "finalizado_con_pendientes":
      return "Finalizado con pendientes"
    case "finalizado_completo":
      return "Finalizado completo"
    default:
      return value
  }
}

export const columns: ColumnDef<PlanTrabajoListItem>[] = [
  {
    accessorFn: (row) => row.cliente.name,
    id: "clienteNombre",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate font-medium">{row.original.cliente.name}</span>
      </div>
    ),
  },
  {
    accessorFn: (row) => row.propuesta.codigo,
    id: "propuestaCodigo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Propuesta" />,
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate text-sm text-muted-foreground">
          {row.original.propuesta.codigo}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "fechaInicio",
    id: "fechaInicio",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Inicio" />,
    cell: ({ row }) => {
      return <div className="text-sm text-muted-foreground">{formatDateOnly(String(row.getValue("fechaInicio")), "es-AR")}</div>
    },
  },
  {
    accessorKey: "fechaFin",
    id: "fechaFin",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fin" />,
    cell: ({ row }) => {
      return <div className="text-sm text-muted-foreground">{formatDateOnly(String(row.getValue("fechaFin")), "es-AR")}</div>
    },
  },
  {
    accessorKey: "estado",
    id: "estado",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const estado = String(row.getValue("estado") ?? "")
      const isPendiente = estado === "pendiente_programacion"
      return <Badge variant={isPendiente ? "sinergia" : "secondary"}>{formatEstado(estado)}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/planes/${row.original.id}`}>Ver</Link>
        </Button>
      )
    },
  },
]
