import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InformesTable } from "./informes-table";
import { Informe } from "./actions";

interface InformesTableWrapperProps {
  data: Informe[];
  pageCount?: number;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  facetCounts?: Record<string, Record<string, number>>;
}

export function InformesTableWrapper({
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFiltersChange,
  facetCounts,
}: InformesTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Informes</CardTitle>
            <CardDescription>
              Administra todos los informes generados a partir de propuestas aceptadas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <InformesTable
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
