"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InspeccionesTable } from "./inspecciones-table";
import { TableState } from "@/components/tables/table-state";
import { Can } from "@/components/rbac/Can";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { InspeccionSummaryDto } from "@/dtos";

interface InspeccionesTableWrapperProps {
  data: InspeccionSummaryDto[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function InspeccionesTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: InspeccionesTableWrapperProps) {
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
            <CardTitle>Inspecciones</CardTitle>
            <CardDescription>Listado de formularios de inspección ambiental</CardDescription>
          </div>
          <Can permission={PERMISSIONS.INSPECCIONES_CREATE}>
            <Button asChild className="bg-sinergia text-white hover:bg-sinergia-hover">
              <Link href="/dashboard/inspecciones/nueva">
                <Plus className="mr-2 h-4 w-4" />
                Nueva inspección
              </Link>
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        <TableState isEmpty={isEmpty} emptyMessage="No hay inspecciones cargadas.">
          <InspeccionesTable
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
