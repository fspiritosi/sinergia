"use client"

import { useQuery } from "@tanstack/react-query"
import { getTiposInforme } from "./components/actions"
import { TiposInformeTableWrapper } from "./components/tipoInforme-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function TiposInforme() {
  const { data: tiposInforme, isLoading, error } = useQuery({
    queryKey: ["tipos-informe"],
    queryFn: getTiposInforme,
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
        Error al cargar tipos de informe: {error.message}
      </div>
    )
  }

  return <TiposInformeTableWrapper data={tiposInforme || []} />
}

export default TiposInforme
