"use client"

import { useQuery } from "@tanstack/react-query"
import { getPropuestas } from "./components/actions"
import { PropuestasTableWrapper } from "@/components/propuestas/components/propuestas-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Propuestas() {
  const { data: propuestas, isLoading, error } = useQuery({
    queryKey: ["propuestas"],
    queryFn: getPropuestas,
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

  return <PropuestasTableWrapper data={propuestas || []} />
}

export default Propuestas