"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getInformesPaginated } from "./components/actions"
import { InformesTableWrapper } from "./components/informes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Informes() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["informes", pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      getInformesPaginated({
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
        Error al cargar informes: {error.message}
      </div>
    )
  }

  return (
    <InformesTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}

export default Informes
