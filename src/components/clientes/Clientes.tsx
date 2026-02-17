"use client"

import { useQuery } from "@tanstack/react-query"
import { getClientes } from "./components/actions"
import { ClientesTableWrapper } from "./components/clientes-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Clientes() {
  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
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
        Error al cargar clientes: {error.message}
      </div>
    )
  }

  return <ClientesTableWrapper data={clientes || []} />
}

export default Clientes