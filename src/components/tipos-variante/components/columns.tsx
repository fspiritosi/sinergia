"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { TipoVarianteRowActions } from "./tipoVariante-row-actions";
import type { TipoDeVariante } from "./actions";

export const columns: ColumnDef<TipoDeVariante>[] = [
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
        <span className="max-w-[500px] truncate font-medium">
          {row.getValue("name")}
        </span>
      </div>
    ),
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
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
    cell: ({ row }) => <TipoVarianteRowActions tipoVariante={row.original} />,
  },
];
