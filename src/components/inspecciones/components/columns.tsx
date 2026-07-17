"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatDateOnly } from "@/lib/dates";
import { InspeccionRowActions } from "./inspeccion-row-actions";
import type { InspeccionSummaryDto } from "@/dtos";

export const columns: ColumnDef<InspeccionSummaryDto>[] = [
  {
    accessorKey: "fecha",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha inspección" />,
    cell: ({ row }) => {
      // Preferimos la fecha real de la inspección; si es un registro antiguo sin
      // ese dato, mostramos la fecha de creación como respaldo.
      const fechaInspeccion = row.original.fechaInspeccion;
      const fecha = fechaInspeccion ?? (row.getValue("fecha") as string);
      return <div className="text-sm">{formatDateOnly(fecha)}</div>;
    },
  },
  {
    accessorKey: "clienteNombre",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate font-medium">{row.getValue("clienteNombre")}</div>
    ),
  },
  {
    accessorKey: "tipo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string;
      const label =
        tipo === "inspeccion_base"
          ? "Inspección de Base"
          : tipo === "inspeccion_equipo"
            ? "Inspección de Equipo"
            : tipo;
      return <Badge variant="secondary">{label}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "lugarNombre",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lugar" />,
    cell: ({ row }) => {
      const lugar = row.getValue("lugarNombre") as string | null;
      return <div className="text-sm text-muted-foreground">{lugar ?? "—"}</div>;
    },
  },
  {
    accessorKey: "realizadoPorNombre",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Realizado por" />,
    cell: ({ row }) => {
      const nombre = row.getValue("realizadoPorNombre") as string | null;
      return <div className="text-sm">{nombre ?? "—"}</div>;
    },
  },
  {
    id: "estado",
    accessorKey: "estado",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      if (estado === "completada") {
        return <Badge variant="sinergia">Completada</Badge>;
      }
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
          Borrador
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <InspeccionRowActions inspeccion={row.original} />,
  },
];
