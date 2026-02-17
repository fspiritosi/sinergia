"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { CondicionRowActions } from "./condiciones-row-actions";
import type { Condicion } from "@/generated/client";

export const columns: ColumnDef<Condicion>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
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
    accessorKey: "tipo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string;
      return (
        <Badge variant={tipo === "general" ? "default" : "outline"}>
          {tipo === "general" ? "General" : "Particular"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Título" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[300px] truncate font-medium">{row.getValue("title")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate">{row.getValue("description")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Categoría" />,
    cell: ({ row }) => {
      const category = row.getValue("category") as string | null;
      return (
        <div className="flex space-x-2">
          <span className="max-w-[200px] truncate text-muted-foreground">{category || "-"}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) || "sin-categoria");
    },
  },
  {
    accessorKey: "order",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orden" />,
    cell: ({ row }) => {
      return <div className="text-sm text-muted-foreground">{row.getValue("order")}</div>;
    },
  },
  {
    id: "is_active",
    accessorFn: (row) => String(row.is_active),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge variant={isActive ? "sinergia" : "secondary"}>
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <CondicionRowActions condicion={row.original} />;
    },
  },
];
