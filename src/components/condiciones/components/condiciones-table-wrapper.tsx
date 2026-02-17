"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CondicionesTable } from "./condiciones-table";
import { AddCondicionButton } from "./add-condicion-button";
import { Condicion } from "@/generated/client";

interface CondicionesTableWrapperProps {
  data: Condicion[];
}

export function CondicionesTableWrapper({ data }: CondicionesTableWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Condiciones</CardTitle>
            <CardDescription>
              Administra las condiciones generales y particulares para las propuestas
            </CardDescription>
          </div>
          <AddCondicionButton />
        </div>
      </CardHeader>
      <CardContent>
        <CondicionesTable data={data} />
      </CardContent>
    </Card>
  );
}
