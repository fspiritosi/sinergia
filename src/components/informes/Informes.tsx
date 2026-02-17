"use client"

import { useQuery } from "@tanstack/react-query"
import { getInformes } from "./components/actions"
import { InformesTableWrapper } from "./components/informes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Informes() {
  const { data: informes, isLoading, error } = useQuery({
    queryKey: ["informes"],
    queryFn: getInformes,
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

  return <InformesTableWrapper data={informes || []} />
}

export default Informes
