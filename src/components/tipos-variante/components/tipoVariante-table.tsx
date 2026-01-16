"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import type { TipoDeVariante } from "./actions";

const estadoOptions = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

const fechaOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
];

interface TipoVarianteTableProps {
  data: TipoDeVariante[];
}

export function TipoVarianteTable({ data }: TipoVarianteTableProps) {
  const customSearchFilter = (tipoVariante: TipoDeVariante, searchValue: string) => {
    if (!searchValue) return true;

    const searchLower = searchValue.toLowerCase();
    const name = tipoVariante.name?.toLowerCase() ?? "";
    const description = tipoVariante.description?.toLowerCase() ?? "";

    return name.includes(searchLower) || description.includes(searchLower);
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Buscar por nombre o descripción..."
      customSearchFilter={customSearchFilter}
      filters={[
        {
          columnKey: "is_active",
          title: "Estado",
          options: estadoOptions,
        },
        {
          columnKey: "createdAt",
          title: "Fecha de creación",
          options: fechaOptions,
        },
      ]}
    />
  );
}
