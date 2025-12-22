"use client"

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import { clientLocations } from "./actions";
import { createStringSearchFilter } from "@/components/tables/search-utils";


// Opciones para filtros

const estadoOptions = [
  { value: "true", label: "Activo" },
  { value: "false", label: "Inactivo" },
];

const typeOptions = [
  { value: "mensual", label: "Mensual" },
  { value: "unitario", label: "Unitario" },
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

interface ClientLocationsTableProps {
    data: clientLocations[]
}

export function ClientLocationsTable({ data }: ClientLocationsTableProps) {
    const customSearchFilter = createStringSearchFilter<clientLocations>([
        "name",
        (c) => c.cliente?.name,
    ]);

    return (
        <DataTable
            data={data}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Buscar por nombre o cliente..."
            customSearchFilter={customSearchFilter}
            filters={[
                {
                    columnKey: "is_active",
                    title: "Estado",
                    options: estadoOptions,
                },
                {
                    columnKey: "type",
                    title: "Tipo",
                    options: typeOptions,
                },
                {
                    columnKey: "createdAt",
                    title: "Fecha de Creación",
                    options: fechaOptions,
                },
            ]}
        />
    )
}