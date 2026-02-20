"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropuestasTable } from "@/components/propuestas/components/propuestas-table";
import type { PropuestaTecnica } from "./actions";
import { AddPropuestaButton } from "@/components/propuestas/components/add-propuesta-button";
import { TableState } from "@/components/tables/table-state";

interface PropuestasTableWrapperProps {
  data: PropuestaTecnica[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function PropuestasTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: PropuestasTableWrapperProps) {
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const handleFiltersChange = (filters: Record<string, any>) => {
    const active = Object.entries(filters).some(([k, v]) => {
      if (k === "__search__") return typeof v === "string" && v.length > 0;
      return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null;
    });
    setHasActiveFilters(active);
    onFiltersChange?.(filters);
  };

  const isEmpty = data.length === 0 && !hasActiveFilters;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Propuestas</CardTitle>
            <CardDescription>Administra todas las propuestas de la empresa</CardDescription>
          </div>
          <AddPropuestaButton />
        </div>
      </CardHeader>
      <CardContent>
        <TableState isEmpty={isEmpty} emptyMessage="No hay propuestas cargadas.">
          <PropuestasTable
            data={data}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            onFiltersChange={handleFiltersChange}
            facetCounts={facetCounts}
          />
        </TableState>
      </CardContent>
    </Card>
  );
}
