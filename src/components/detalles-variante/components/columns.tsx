"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { DetalleVariante } from "./actions";
import { DetalleVarianteRowActions } from "./detalleVariante-row-actions";

export const columns: ColumnDef<DetalleVariante>[] = [
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
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[400px] truncate font-medium">
          {row.getValue("name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "variantType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo de Variante" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.variantType?.name ?? "—"}
      </span>
    ),
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.variantType?.name ?? "";
      const nameB = rowB.original.variantType?.name ?? "";
      return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
    },
    filterFn: (row, id, value: string[]) => {
      const current = row.original.variantType?.id ?? "";
      return value.length === 0 || value.includes(current);
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descripción" />
    ),
    cell: ({ row }) => (
      <div className="flex space-x-2">
        <span className="max-w-[500px] truncate text-sm text-muted-foreground">
          {row.getValue("description") ?? "—"}
        </span>
      </div>
    ),
  },
  {
    id: "is_active",
    accessorFn: (row) => String(row.is_active),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge variant={isActive ? "sinergia" : "secondary"}>
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha de creación" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("es-AR")}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DetalleVarianteRowActions detalleVariante={row.original} />
    ),
  },
];
