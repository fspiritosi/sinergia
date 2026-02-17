"use client"

import { useQuery } from "@tanstack/react-query"
import { getDetallesVariante } from "./components/actions"
import { DetalleVarianteTableWrapper } from "./components/detalleVariante-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function DetallesVariante() {
  const { data: detalles, isLoading, error } = useQuery({
    queryKey: ["detalles-variante"],
    queryFn: getDetallesVariante,
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
        Error al cargar detalles de variante: {error.message}
      </div>
    )
  }

  return <DetalleVarianteTableWrapper data={detalles || []} />
}

export default DetallesVariante
