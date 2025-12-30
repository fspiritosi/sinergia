 "use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SerializedCliente } from "@/components/clientes/ClienteDetalle";
import { PropuestasTableWrapper } from "@/components/propuestas/components/propuestas-table-wrapper";
import type { PropuestaTecnica } from "@/components/propuestas/components/actions";
import { ClientLocationTableWrapper } from "@/components/clientLocations/components/clientLocations-table-wrapper";
import type { clientLocations as ClientLocation } from "@/components/clientLocations/components/actions";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useEffect } from "react";
import { useDashboardTitle } from "@/components/dashboard/DashboardTitleContext";

interface ClienteIdWrapperProps {
  data: SerializedCliente;
}

export function ClienteIdWrapper({ data }: ClienteIdWrapperProps) {
  const { setTitle } = useDashboardTitle();

  useEffect(() => {
    setTitle(`Detalle del cliente: ${data.name}`);
    return () => setTitle(null);
  }, [data.name, setTitle]);

  const propuestas: PropuestaTecnica[] = data.propuestas ?? [];

  const clientLocations: ClientLocation[] = (data.clientLocations ?? []).map(
    (loc) => ({
      ...loc,
      createdAt: new Date(loc.createdAt),
      updatedAt: new Date(loc.updatedAt),
      cliente: loc.cliente ?? { id: loc.clienteId, name: "Sin cliente" },
    })
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{data?.name}</CardTitle>
            {/* <CardDescription>{data?.domicilio}</CardDescription> */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="datos" className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="locaciones">Locaciones</TabsTrigger>
            <TabsTrigger value="propuestas">Propuestas</TabsTrigger>
          </TabsList>
          <Separator />

          <TabsContent value="datos">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Nombre" value={data.name} />
              <DetailRow label="CUIT" value={data.cuit} />
              <DetailRow label="Domicilio" value={data.domicilio} />
              <DetailRow label="Teléfono" value={data.telefono ?? "—"} />
              <DetailRow label="Email" value={data.email ?? "—"} />
              <DetailRow
                label="Provincia"
                value={data.provincia?.nombre ?? "Sin provincia"}
              />
              <DetailRow
                label="Ciudad"
                value={data.ciudad?.nombre ?? "Sin ciudad"}
              />
              <DetailRow
                label="Estado"
                value={
                  <Badge variant={data.is_active ? "sinergia" : "secondary"}>
                    {data.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="locaciones">
            {clientLocations.length === 0 ? (
              <div>No hay ubicaciones</div>
            ) : (
              <ClientLocationTableWrapper data={clientLocations} />
            )}
          </TabsContent>

          <TabsContent value="propuestas">
            {propuestas.length === 0 ? (
              <div>No hay propuestas</div>
            ) : (
              <PropuestasTableWrapper data={propuestas} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}