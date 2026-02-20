"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
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
  serverFacetCounts?: Record<string, Record<string, number>>;
}

export function DataTableToolbar<TData>({
  table,
  searchKey = "title",
  searchPlaceholder = "Filter...",
  customSearchFilter,
  filters = [],
  serverFacetCounts,
}: DataTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = React.useState("");

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    (customSearchFilter && table.getState().globalFilter);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={
            customSearchFilter
              ? searchValue
              : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
          }
          onChange={(event) => {
            const value = event.target.value;
            if (customSearchFilter) {
              setSearchValue(value);
              table.setGlobalFilter(value);
            } else {
              // Usar filtro de columna por defecto
              table.getColumn(searchKey)?.setFilterValue(value);
            }
          }}
          className="h-8 w-[150px] lg:w-[250px] ring-1 ring-muted"
        />
        {filters.map((filter) => {
          const column = table.getColumn(filter.columnKey);
          return column ? (
            <DataTableFacetedFilter
              key={filter.columnKey}
              column={column}
              title={filter.title}
              options={filter.options}
              serverCounts={serverFacetCounts?.[filter.columnKey]}
            />
          ) : null;
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              if (customSearchFilter) {
                table.setGlobalFilter("");
                setSearchValue("");
              }
            }}
            className="h-8 px-2 lg:px-3"
          >
            Limpiar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
