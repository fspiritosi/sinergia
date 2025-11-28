"use client"

import { DataTable } from "@/components/tables/data-table"
import { columns } from "./columns"
import { Servicio } from "@/generated/client"


// Opciones para filtros

const estadoOptions = [
    { value: "true", label: "Activo" },
    { value: "false", label: "Inactivo" },
]

const typeOptions = [
    { value: "mensual", label: "Mensual" },
    { value: "unitario", label: "Unitario" },
]

// Filtros por rango de fechas (últimos períodos)
const fechaOptions = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Esta semana" },
    { value: "month", label: "Este mes" },
    { value: "quarter", label: "Este trimestre" },
    { value: "year", label: "Este año" },
]

// Filtros por tipo de contacto y dominio de email - REMOVIDOS

interface ServiceTableProps {
    data: Servicio[]
}

export function ServiceTable({ data }: ServiceTableProps) {
    // Función de filtro personalizada para buscar por nombre, CUIT o email
    const customSearchFilter = (servicio: Servicio, searchValue: string): boolean => {
        if (!searchValue) return true

        const searchLower = searchValue.toLowerCase()
        const name = servicio.name?.toLowerCase() || ""

        return name.includes(searchLower)
    }

    return (
        <DataTable
            data={data}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Buscar por nombre..."
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
                {
                    columnKey: "type",
                    title: "Tipo",
                    options: typeOptions,
                },

            ]}
        />
    )
}