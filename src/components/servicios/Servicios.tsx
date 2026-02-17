"use client"

import { useQuery } from "@tanstack/react-query"
import { getServicios } from "./components/actions"
import { ServiciosTableWrapper } from "./components/servicios-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Servicios() {
  const { data: servicios, isLoading, error } = useQuery({
    queryKey: ["servicios"],
    queryFn: getServicios,
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
        Error al cargar servicios: {error.message}
      </div>
    )
  }

  return <ServiciosTableWrapper data={servicios || []} />
}

export default Servicios
