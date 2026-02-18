"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  customSearchFilter?: (row: TData, searchValue: string) => boolean;
  filters?: {
    columnKey: string;
    title: string;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
  // Server-side pagination props (optional)
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  customSearchFilter,
  filters,
  pageCount: serverPageCount,
  pagination: serverPagination,
  onPaginationChange: onServerPaginationChange,
  onFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [clientPagination, setClientPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use server pagination if provided, otherwise use client pagination
  const isServerSide = !!serverPagination && !!onServerPaginationChange;
  const pagination = isServerSide ? serverPagination : clientPagination;

  // Track previous filters to avoid unnecessary calls
  const prevFiltersRef = React.useRef<string>("");

  // Notify parent of filter changes (server-side only)
  React.useEffect(() => {
    if (isServerSide && onFiltersChange) {
      const filtersObject: Record<string, any> = {};

      // Include column filters
      columnFilters.forEach((filter) => {
        filtersObject[filter.id] = filter.value;
      });

      // Include global search filter (if any)
      if (globalFilter) {
        filtersObject.__search__ = globalFilter;
      }

      // Only call onFiltersChange if filters actually changed
      const filtersString = JSON.stringify(filtersObject);
      if (prevFiltersRef.current !== filtersString) {
        prevFiltersRef.current = filtersString;
        onFiltersChange(filtersObject);
      }
    }
  }, [columnFilters, globalFilter, isServerSide, onFiltersChange]);

  const table = useReactTable({
    data,
    columns,
    pageCount: isServerSide ? serverPageCount : undefined,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (isServerSide && onServerPaginationChange) {
        const newPagination = typeof updater === "function" ? updater(pagination) : updater;
        onServerPaginationChange(newPagination);
      } else {
        setClientPagination((prev) => {
          const newPagination = typeof updater === "function" ? updater(prev) : updater;
          return newPagination;
        });
      }
    },
    // Only use client-side globalFilterFn if not in server-side mode
    globalFilterFn:
      !isServerSide && customSearchFilter
        ? (row, columnId, filterValue) => {
            return customSearchFilter(row.original, filterValue);
          }
        : undefined,
    manualPagination: isServerSide,
    manualFiltering: isServerSide,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        customSearchFilter={customSearchFilter}
        filters={filters}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={table.getPageCount()}
      />
    </div>
  );
}
