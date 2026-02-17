"use client"

import { useQuery } from "@tanstack/react-query"
import { getItems } from "./components/actions"
import { ItemsTableWrapper } from "./components/items-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Items() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
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

  return <ItemsTableWrapper data={items || []} />
}

export default Items
