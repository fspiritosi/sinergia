"use client"

import { useQuery } from "@tanstack/react-query"
import { getClientLocations } from "./components/actions"
import { ClientLocationTableWrapper } from "./components/clientLocations-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function ClientLocations() {
  const { data: clientLocations, isLoading, error } = useQuery({
    queryKey: ["client-locations"],
    queryFn: getClientLocations,
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
        Error al cargar ubicaciones de clientes: {error.message}
      </div>
    )
  }

  return <ClientLocationTableWrapper data={clientLocations || []} />
}

export default ClientLocations
