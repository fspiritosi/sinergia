"use client";

import { useQuery } from "@tanstack/react-query";
import { getCondiciones } from "./components/actions";
import { CondicionesTableWrapper } from "./components/condiciones-table-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

function Condiciones() {
  const {
    data: condiciones,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["condiciones"],
    queryFn: getCondiciones,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-destructive">Error al cargar condiciones: {error.message}</div>;
  }

  return <CondicionesTableWrapper data={condiciones || []} />;
}

export default Condiciones;
