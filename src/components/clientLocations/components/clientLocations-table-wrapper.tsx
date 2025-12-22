import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientLocationsTable } from "./clientLocations-table";
import { AddClientLocationsButton } from "./add-clientLocations-button";
import { clientLocations } from "./actions";
import { TableState } from "@/components/tables/table-state";

interface ClientLocationTableWrapperProps {
  data: clientLocations[];
}

export function ClientLocationTableWrapper({ data }: ClientLocationTableWrapperProps) {
  const isEmpty = data.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Locaciones de Clientes</CardTitle>
            <CardDescription>Administra todas las locaciones de los Clientes</CardDescription>
          </div>
          <AddClientLocationsButton />
        </div>
      </CardHeader>
      <CardContent>
        <TableState isEmpty={isEmpty} emptyMessage="No hay locaciones cargadas.">
          <ClientLocationsTable data={data} />
        </TableState>
      </CardContent>
    </Card>
  );
}