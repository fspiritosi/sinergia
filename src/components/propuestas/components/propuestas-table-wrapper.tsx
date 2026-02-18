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
}

export function PropuestasTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
}: PropuestasTableWrapperProps) {
  const isEmpty = data.length === 0;

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
            onFiltersChange={onFiltersChange}
          />
        </TableState>
      </CardContent>
    </Card>
  );
}
