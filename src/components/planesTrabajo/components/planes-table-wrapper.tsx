import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanesTrabajoTable } from "./planes-table"
import type { PlanTrabajoListItem } from "./actions"

interface PlanesTrabajoTableWrapperProps {
  data: PlanTrabajoListItem[]
}

export function PlanesTrabajoTableWrapper({ data }: PlanesTrabajoTableWrapperProps) {
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
        <PlanesTrabajoTable data={data} />
      </CardContent>
    </Card>
  )
}
