"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { Item } from "./actions";

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

interface ItemsTableProps {
  data: Item[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function ItemsTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: ItemsTableProps) {
  // Función de filtro personalizada para buscar por nombre, CUIT o email
  const customSearchFilter = (item: Item, searchValue: string): boolean => {
    if (!searchValue) return true;

    const searchLower = searchValue.toLowerCase();
    const name = item.name?.toLowerCase() || "";

    return name.includes(searchLower);
  };

  const mappedData = data.map((item) => ({
    ...item,
    is_active: String(item.is_active),
  }));

  return (
    <DataTable
      data={mappedData}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Buscar por nombre..."
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
      ]}
    />
  );
}
