"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns, type ClienteWithRelations } from "./columns";
import type { ColumnDef } from "@tanstack/react-table";
import { createStringSearchFilter } from "@/components/tables/search-utils";

// Opciones para filtros

const estadoOptions = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

// Filtros por rango de fechas (últimos períodos)
const fechaOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
];

// Filtros por tipo de contacto y dominio de email - REMOVIDOS

interface ClientesTableProps {
  data: ClienteWithRelations[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function ClientesTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: ClientesTableProps) {
  const customSearchFilter = createStringSearchFilter<ClienteWithRelations>([
    "name",
    "cuit",
    "email",
    // (c) => c.provincia?.nombre,
    // (c) => c.ciudad?.nombre,
  ]);

  return (
    <DataTable
      data={data}
      columns={columns as ColumnDef<ClienteWithRelations, unknown>[]}
      searchKey="name"
      searchPlaceholder="Buscar por nombre, CUIT o email..."
      customSearchFilter={customSearchFilter}
      pageCount={pageCount}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      onFiltersChange={onFiltersChange}
      facetCounts={facetCounts}
      filters={[
        {
          columnKey: "is_active",
          title: "Estado",
          options: estadoOptions,
        },
        {
          columnKey: "createdAt",
          title: "Fecha de Creación",
          options: fechaOptions,
        },
        // {
        //   columnKey: "provinciaNombre",
        //   title: "Provincia",
        //   options: Array.from(
        //     new Set(
        //       data
        //         .map((c) => c.provincia?.nombre)
        //         .filter((v): v is string => !!v)
        //     )
        //   )
        //     .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
        //     .map((p) => ({ value: p, label: p })),
        // },
        // {
        //   columnKey: "ciudadNombre",
        //   title: "Ciudad",
        //   options: Array.from(
        //     new Set(
        //       data
        //         .map((c) => c.ciudad?.nombre)
        //         .filter((v): v is string => !!v)
        //     )
        //   )
        //     .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
        //     .map((p) => ({ value: p, label: p })),
        // },
      ]}
    />
  );
}
