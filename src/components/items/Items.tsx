"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getItemsPaginated } from "./components/actions"
import { ItemsTableWrapper } from "./components/items-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Items() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["items", pagination.pageIndex + 1, pagination.pageSize],
    queryFn: () =>
      getItemsPaginated({
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
        Error al cargar items: {error.message}
      </div>
    )
  }

  return (
    <ItemsTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
    />
  )
}

export default Items
