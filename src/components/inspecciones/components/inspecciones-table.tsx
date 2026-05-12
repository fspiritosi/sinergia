"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import type { ColumnDef } from "@tanstack/react-table";
import type { InspeccionSummaryDto } from "@/dtos";

const estadoOptions = [
  { value: "borrador", label: "Borrador" },
  { value: "completada", label: "Completada" },
];

const tipoOptions = [
  { value: "inspeccion_base", label: "Inspección de Base" },
  { value: "inspeccion_equipo", label: "Inspección de Equipo" },
];

interface InspeccionesTableProps {
  data: InspeccionSummaryDto[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function InspeccionesTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: InspeccionesTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns as ColumnDef<InspeccionSummaryDto, unknown>[]}
      searchKey="clienteNombre"
      searchPlaceholder="Buscar por cliente o lugar..."
      pageCount={pageCount}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      onFiltersChange={onFiltersChange}
      facetCounts={facetCounts}
      filters={[
        {
          columnKey: "estado",
          title: "Estado",
          options: estadoOptions,
        },
        {
          columnKey: "tipo",
          title: "Tipo",
          options: tipoOptions,
        },
      ]}
    />
  );
}
