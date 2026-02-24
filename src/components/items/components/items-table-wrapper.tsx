import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemsTable } from "./items-table";
import { AddItemButton } from "./add-item-button";
import { Items, Servicio } from "@/generated/client";
import { AsignItemButton } from "./asign-item-button";
import { Item } from "./actions";

interface ItemsTableWrapperProps {
  data: Item[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function ItemsTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: ItemsTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>Administra todos los items de la empresa</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <AsignItemButton />
            <AddItemButton />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ItemsTable
          data={data}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          onFiltersChange={onFiltersChange}
          facetCounts={facetCounts}
        />
      </CardContent>
    </Card>
  );
}
