"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientesTable } from "./clientes-table";
import { AddClienteButton } from "./add-cliente-button";
import { TableState } from "@/components/tables/table-state";
import { type ClienteWithRelations } from "./columns";
import { Cliente } from "@/generated/client";

interface ClientesTableWrapperProps {
  data: Cliente[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function ClientesTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: ClientesTableWrapperProps) {
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
  const normalized = data.map((c) => ({
    ...c,
    provincia: (c as any).provincia ?? null,
    ciudad: (c as any).ciudad ?? null,
  })) as ClienteWithRelations[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Administra todos los clientes de la empresa</CardDescription>
          </div>
          <AddClienteButton />
        </div>
      </CardHeader>
      <CardContent>
        <TableState isEmpty={isEmpty} emptyMessage="No hay clientes cargados.">
          <ClientesTable
            data={normalized}
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
