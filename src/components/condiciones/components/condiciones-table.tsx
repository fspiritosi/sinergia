"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { Condicion } from "@/generated/client";

// Opciones para filtros
const estadoOptions = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

const tipoOptions = [
  { value: "general", label: "General" },
  { value: "particular", label: "Particular" },
];

// Categorías comunes (se pueden extender según las condiciones existentes)
const categoriaOptions = [
  { value: "Visitas", label: "Visitas" },
  { value: "Incluye", label: "Incluye" },
  { value: "Plazos", label: "Plazos" },
  { value: "Facturación", label: "Facturación" },
  { value: "Condiciones de Pago", label: "Condiciones de Pago" },
  { value: "Ajuste", label: "Ajuste" },
  { value: "sin-categoria", label: "Sin categoría" },
];

interface CondicionesTableProps {
  data: Condicion[];
}

export function CondicionesTable({ data }: CondicionesTableProps) {
  // Función de filtro personalizada para buscar por título o descripción
  const customSearchFilter = (condicion: Condicion, searchValue: string): boolean => {
    if (!searchValue) return true;

    const searchLower = searchValue.toLowerCase();
    const title = condicion.title?.toLowerCase() || "";
    const description = condicion.description?.toLowerCase() || "";

    return title.includes(searchLower) || description.includes(searchLower);
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="title"
      searchPlaceholder="Buscar por título o descripción..."
      customSearchFilter={customSearchFilter}
      filters={[
        {
          columnKey: "tipo",
          title: "Tipo",
          options: tipoOptions,
        },
        {
          columnKey: "category",
          title: "Categoría",
          options: categoriaOptions,
        },
        {
          columnKey: "is_active",
          title: "Estado",
          options: estadoOptions,
        },
      ]}
    />
  );
}
