"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { Eye } from "lucide-react";
import Link from "next/link";
import { formatDateOnly } from "@/lib/dates";
import type { InspeccionSummaryDto } from "@/dtos";

export const columns: ColumnDef<InspeccionSummaryDto>[] = [
  {
    accessorKey: "fecha",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => {
      const fecha = row.getValue("fecha") as string;
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
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/dashboard/inspecciones/${row.original.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver inspección</span>
        </Link>
      </Button>
    ),
  },
];
