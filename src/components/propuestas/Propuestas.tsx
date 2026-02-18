"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPropuestasPaginated } from "./components/actions";
import { PropuestasTableWrapper } from "@/components/propuestas/components/propuestas-table-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

function Propuestas() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    // Reset pagination to first page when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Extract search from filters and pass it separately to the API
  const { __search__, ...columnFilters } = filters;
  const searchValue = typeof __search__ === "string" ? __search__ : undefined;

  const { data, isLoading, error } = useQuery({
    // Use JSON.stringify for stable queryKey comparison
    queryKey: [
      "propuestas",
      pagination.pageIndex + 1,
      pagination.pageSize,
      searchValue,
      JSON.stringify(columnFilters),
    ],
    queryFn: () =>
      getPropuestasPaginated({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: searchValue,
        filters: columnFilters,
      }),
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
    return <div className="p-4 text-destructive">Error al cargar propuestas: {error.message}</div>;
  }

  return (
    <PropuestasTableWrapper
      data={data?.data || []}
      pageCount={data?.pageCount || 0}
      pagination={pagination}
      onPaginationChange={setPagination}
      onFiltersChange={handleFiltersChange}
    />
  );
}

export default Propuestas;
