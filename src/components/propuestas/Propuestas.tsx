"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPropuestasPaginated } from "./components/actions"
import { PropuestasTableWrapper } from "@/components/propuestas/components/propuestas-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Propuestas() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["propuestas", pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      getPropuestasPaginated({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error al cargar propuestas: {error.message}
      </div>
    )
  }

  return (
    <PropuestasTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}

export default Propuestas