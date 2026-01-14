"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TipoVarianteTable } from "./tipoVariante-table";
import type { TipoDeVariante } from "./actions";
import { AddTipoVarianteButton } from "./add-tipoVariante-button";

interface TipoVarianteTableWrapperProps {
  data: TipoDeVariante[];
}

export function TipoVarianteTableWrapper({ data }: TipoVarianteTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Tipos de Variantes</CardTitle>
            <CardDescription>Gestioná los diferentes tipos de variantes disponibles.</CardDescription>
          </div>
          <AddTipoVarianteButton />
        </div>
      </CardHeader>
      <CardContent>
        <TipoVarianteTable data={data} />
      </CardContent>
    </Card>
  );
}
