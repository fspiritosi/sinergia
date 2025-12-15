import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InformesTable } from "./informes-table"
import { Informe } from "./actions"

interface InformesTableWrapperProps {
  data: Informe[]
}

export function InformesTableWrapper({ data }: InformesTableWrapperProps) {
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
        <InformesTable data={data} />
      </CardContent>
    </Card>
  )
}
