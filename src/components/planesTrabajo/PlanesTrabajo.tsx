"use client"

import { useQuery } from "@tanstack/react-query"
import { getPlanesTrabajo } from "./components/actions"
import { PlanesTrabajoTableWrapper } from "./components/planes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function PlanesTrabajo() {
  const { data: planes, isLoading, error } = useQuery({
    queryKey: ["planes-trabajo"],
    queryFn: getPlanesTrabajo,
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

  return <PlanesTrabajoTableWrapper data={planes || []} />
}

export default PlanesTrabajo
