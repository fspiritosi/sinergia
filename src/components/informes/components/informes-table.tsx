"use client"

import { DataTable } from "@/components/tables/data-table"
import { columns } from "./columns"
import { Informe } from "./actions"

const estadoOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "entregado", label: "Entregado" },
]

const fechaOptions = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este año" },
]

interface InformesTableProps {
  data: Informe[]
}

export function InformesTable({ data }: InformesTableProps) {
  const customSearchFilter = (informe: Informe, searchValue: string): boolean => {
    if (!searchValue) return true

    const searchLower = searchValue.toLowerCase()
    const cliente = informe.cliente.name?.toLowerCase() || ""
    const tipo = informe.tipoDeInforme.name?.toLowerCase() || ""

    return cliente.includes(searchLower) || tipo.includes(searchLower)
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="clienteNombre"
      searchPlaceholder="Buscar por cliente o tipo de informe..."
      customSearchFilter={customSearchFilter}
      filters={[
        {
          columnKey: "estado",
          title: "Estado",
          options: estadoOptions,
        },
        {
          columnKey: "fechaVencimiento",
          title: "Fecha de Realización",
          options: fechaOptions,
        },
      ]}
    />
  )
}
