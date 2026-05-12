"use client";

import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getInspeccionesPaginated } from "./components/actions";
import { InspeccionesTableWrapper } from "./components/inspecciones-table-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

export function Inspecciones() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const { __search__, ...columnFilters } = filters;
  const searchValue = typeof __search__ === "string" ? __search__ : undefined;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "inspecciones",
      pagination.pageIndex + 1,
      pagination.pageSize,
      searchValue,
      JSON.stringify(columnFilters),
    ],
    queryFn: () =>
      getInspeccionesPaginated({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        search: searchValue,
        filters: columnFilters,
      }),
    placeholderData: keepPreviousData,
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
    return (
      <div className="p-4 text-destructive">
        Error al cargar inspecciones: {(error as Error).message}
      </div>
    );
  }

  return (
    <div
      className={
        isFetching
          ? "opacity-60 pointer-events-none transition-opacity duration-150"
          : "transition-opacity duration-150"
      }
    >
      <InspeccionesTableWrapper
        data={data?.data || []}
        pageCount={data?.pageCount || 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        onFiltersChange={handleFiltersChange}
        facetCounts={data?.facetCounts}
      />
    </div>
  );
}
