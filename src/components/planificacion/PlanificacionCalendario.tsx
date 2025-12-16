import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanificacionCalendarioClient } from "./components/planificacion-calendario-client"

export default async function PlanificacionCalendario() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planificación</CardTitle>
        <CardDescription>Calendario de programaciones de planes de trabajo</CardDescription>
      </CardHeader>
      <CardContent>
        <PlanificacionCalendarioClient />
      </CardContent>
    </Card>
  )
}
