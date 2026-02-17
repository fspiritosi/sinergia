"use client"

import { useQuery } from "@tanstack/react-query"
import { getUsers } from "./components/actions"
import { UsersTableWrapper } from "./components/user-table-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

function Usuarios() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["usuarios"],
    queryFn: getUsers,
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
        Error al cargar usuarios: {error.message}
      </div>
    )
  }

  return <UsersTableWrapper data={users || []} />
}

export default Usuarios
