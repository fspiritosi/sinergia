"use client"

import { DataTable } from "@/components/tables/data-table";
import { columns, type ClientLocationWithRelations } from "./columns";
import { clientLocations } from "./actions";
import { createStringSearchFilter } from "@/components/tables/search-utils";
import type { ColumnDef } from "@tanstack/react-table";


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
    data: ClientLocationWithRelations[]
}

export function ClientLocationsTable({ data }: ClientLocationsTableProps) {
    const customSearchFilter = createStringSearchFilter<ClientLocationWithRelations>([
        "name",
        (c) => c.cliente?.name,
        (c) => c.provincia?.nombre,
        (c) => c.ciudad?.nombre,
    ]);

    return (
        <DataTable
            data={data}
            columns={columns as ColumnDef<ClientLocationWithRelations, unknown>[]}
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
                    columnKey: "provinciaNombre",
                    title: "Provincia",
                    options: Array.from(
                        new Set(
                            data
                                .map((c) => c.provincia?.nombre)
                                .filter((v): v is string => !!v)
                        )
                    )
                        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
                        .map((p) => ({ value: p, label: p })),
                },
                {
                    columnKey: "ciudadNombre",
                    title: "Ciudad",
                    options: Array.from(
                        new Set(
                            data
                                .map((c) => c.ciudad?.nombre)
                                .filter((v): v is string => !!v)
                        )
                    )
                        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
                        .map((p) => ({ value: p, label: p })),
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