import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanesTrabajoTable } from "./planes-table";
import type { PlanTrabajoListItem } from "./actions";

interface PlanesTrabajoTableWrapperProps {
  data: PlanTrabajoListItem[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function PlanesTrabajoTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: PlanesTrabajoTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Planes de Trabajo</CardTitle>
            <CardDescription>
              Administra los planes de trabajo generados a partir de propuestas mensuales aceptadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PlanesTrabajoTable
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
