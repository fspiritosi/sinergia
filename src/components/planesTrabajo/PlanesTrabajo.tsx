"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getPlanesTrabajoPaginated } from "./components/actions"
import { PlanesTrabajoTableWrapper } from "./components/planes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function PlanesTrabajo() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["planes-trabajo", pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      getPlanesTrabajoPaginated({
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
        Error al cargar planes de trabajo: {error.message}
      </div>
    )
  }

  return (
    <PlanesTrabajoTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}

export default PlanesTrabajo
