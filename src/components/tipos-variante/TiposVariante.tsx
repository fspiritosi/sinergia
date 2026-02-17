"use client"

import { useQuery } from "@tanstack/react-query"
import { getTiposVariante } from "./components/actions"
import { TipoVarianteTableWrapper } from "./components/tipoVariante-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function TiposVariante() {
  const { data: tiposVariante, isLoading, error } = useQuery({
    queryKey: ["tipos-variante"],
    queryFn: getTiposVariante,
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
        Error al cargar tipos de variante: {error.message}
      </div>
    )
  }

  return <TipoVarianteTableWrapper data={tiposVariante || []} />
}

export default TiposVariante
