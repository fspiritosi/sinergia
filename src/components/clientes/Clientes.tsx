"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getClientesPaginated } from "./components/actions"
import { ClientesTableWrapper } from "./components/clientes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Clientes() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["clientes", pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      getClientesPaginated({
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
        Error al cargar clientes: {error.message}
      </div>
    )
  }

  return (
    <ClientesTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}

export default Clientes