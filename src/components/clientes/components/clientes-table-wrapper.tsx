import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientesTable } from "./clientes-table";
import { AddClienteButton } from "./add-cliente-button";
import { TableState } from "@/components/tables/table-state";
import { type ClienteWithRelations } from "./columns";
import { Cliente } from "@/generated/client";

interface ClientesTableWrapperProps {
  data: Cliente[];
}

export function ClientesTableWrapper({ data }: ClientesTableWrapperProps) {
  const isEmpty = data.length === 0;
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
          <ClientesTable data={normalized} />
        </TableState>
      </CardContent>
    </Card>
  );
}