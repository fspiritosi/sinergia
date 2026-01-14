"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetalleVariante } from "./actions";
import { DetalleVarianteTable } from "./detalleVariante-table";
import { AddDetalleVarianteButton } from "./add-detalleVariante-button";

interface DetalleVarianteTableWrapperProps {
  data: DetalleVariante[];
}

export function DetalleVarianteTableWrapper({ data }: DetalleVarianteTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Detalles de Variantes</CardTitle>
            <CardDescription>Gestioná los detalles disponibles para cada tipo de variante.</CardDescription>
          </div>
          <AddDetalleVarianteButton />
        </div>
      </CardHeader>
      <CardContent>
        <DetalleVarianteTable data={data} />
      </CardContent>
    </Card>
  );
}
