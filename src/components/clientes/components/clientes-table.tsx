"use client"

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { Cliente } from "@/generated/client";
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
  data: Cliente[];
}

export function ClientesTable({ data }: ClientesTableProps) {
  const customSearchFilter = createStringSearchFilter<Cliente>([
    "name",
    "cuit",
    "email",
  ]);

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Buscar por nombre, CUIT o email..."
      customSearchFilter={customSearchFilter}
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