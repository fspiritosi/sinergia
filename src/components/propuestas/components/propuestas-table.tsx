"use client"

import { DataTable } from "@/components/tables/data-table";
import { columns } from "./columns";
import type { PropuestaTecnica } from "./actions";
import { createStringSearchFilter } from "@/components/tables/search-utils";
const Estado = {
  pendiente: "pendiente",
  aprobada: "aprobada",
  rechazada: "rechazada",
  en_progreso: "en_progreso",
  finalizada: "finalizada",
} as const;


// Opciones para filtros


const estadoOptions = [
  { value: Estado.pendiente, label: "Pendiente" },
  { value: Estado.aprobada, label: "Aprobada" },
  { value: Estado.rechazada, label: "Rechazada" },
  { value: Estado.en_progreso, label: "En Progreso" },
  { value: Estado.finalizada, label: "Finalizada" },
];
    
// Filtros por rango de fechas (últimos períodos)
const fechaOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
];

const tipoOptions = [
  { value: "mensual", label: "Mensual" },
  { value: "unitario", label: "Unitario" },
];

// Filtros por tipo de contacto y dominio de email - REMOVIDOS

interface PropuestasTableProps {
    data: PropuestaTecnica[]
}

export function PropuestasTable({ data }: PropuestasTableProps) {
    const customSearchFilter = createStringSearchFilter<PropuestaTecnica>([
        "codigo",
        (p) => p.cliente?.name,
        (p) => p.servicios?.name,
    ]);

    return (
        <DataTable
            data={data}
            columns={columns}
            searchKey="codigo"
            searchPlaceholder="Buscar por código, cliente o servicio..."
            customSearchFilter={customSearchFilter}
            filters={[
                {
                    columnKey: "status",
                    title: "Estado",
                    options: estadoOptions,
                },
                {
                    columnKey: "createdAt",
                    title: "Fecha de Creación",
                    options: fechaOptions,
                },
                {
                    columnKey: "moneda",
                    title: "Moneda",
                    options: [
                        { value: "usd", label: "USD" },
                        { value: "ars", label: "ARS" },
                    ],
                },
                {
                    columnKey: "type",
                    title: "Tipo",
                    options: tipoOptions,
                },
            ]}
        />
    )
}