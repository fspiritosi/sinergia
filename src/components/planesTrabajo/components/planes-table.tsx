"use client"

import { DataTable } from "@/components/tables/data-table"
import { columns } from "./columns"
import type { PlanTrabajoListItem } from "./actions"

interface PlanesTrabajoTableProps {
  data: PlanTrabajoListItem[]
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
}

const estadoOptions = [
  { value: "pendiente_programacion", label: "Pendiente de Programación" },
  { value: "programado_incompleto", label: "Programado incompleto" },
  { value: "programado_completo", label: "Programado completo" },
  { value: "en_desarrollo", label: "En desarrollo" },
  { value: "finalizado_con_pendientes", label: "Finalizado con pendientes" },
  { value: "finalizado_completo", label: "Finalizado completo" },
]

export function PlanesTrabajoTable({
  data,
  pageCount,
  pagination,
  onPaginationChange,
}: PlanesTrabajoTableProps) {
  const customSearchFilter = (plan: PlanTrabajoListItem, searchValue: string): boolean => {
    if (!searchValue) return true

    const searchLower = searchValue.toLowerCase()
    const cliente = plan.cliente?.name?.toLowerCase() || ""
    const propuesta = plan.propuesta?.codigo?.toLowerCase() || ""

    return cliente.includes(searchLower) || propuesta.includes(searchLower)
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="clienteNombre"
      searchPlaceholder="Buscar por cliente o propuesta..."
      customSearchFilter={customSearchFilter}
      pageCount={pageCount}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      filters={[
        {
          columnKey: "estado",
          title: "Estado",
          options: estadoOptions,
        },
      ]}
    />
  )
}
