"use client";

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import type { DetalleVariante } from "./actions";

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

interface DetalleVarianteTableProps {
  data: DetalleVariante[];
}

function buildVariantTypeOptions(data: DetalleVariante[]) {
  const map = new Map<string, string>();
  data.forEach((detalle) => {
    if (detalle.variantType?.id && detalle.variantType?.name) {
      map.set(detalle.variantType.id, detalle.variantType.name);
    }
  });

  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export function DetalleVarianteTable({ data }: DetalleVarianteTableProps) {
  const tipoVarianteOptions = buildVariantTypeOptions(data);
  const customSearchFilter = (detalle: DetalleVariante, searchValue: string) => {
    if (!searchValue) return true;

    const searchLower = searchValue.toLowerCase();
    const name = detalle.name?.toLowerCase() ?? "";
    const description = detalle.description?.toLowerCase() ?? "";
    const tipo = detalle.variantType?.name?.toLowerCase() ?? "";

    return (
      name.includes(searchLower) ||
      description.includes(searchLower) ||
      tipo.includes(searchLower)
    );
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Buscar por nombre, descripción o tipo..."
      customSearchFilter={customSearchFilter}
      filters={[
        {
          columnKey: "is_active",
          title: "Estado",
          options: estadoOptions,
        },
        ...(tipoVarianteOptions.length
          ? [
              {
                columnKey: "variantType",
                title: "Tipo de Variante",
                options: tipoVarianteOptions,
              } as const,
            ]
          : []),
        {
          columnKey: "createdAt",
          title: "Fecha de creación",
          options: fechaOptions,
        },
      ]}
    />
  );
}
