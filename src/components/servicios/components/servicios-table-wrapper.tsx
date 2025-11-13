import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceTable } from './service-table'
import { AddServiceButton } from './add-service-button'
import { Servicio } from "@/generated/client"

interface ServiciosTableWrapperProps {
    data: Servicio[]
}

export function ServiciosTableWrapper({ data }: ServiciosTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Servicios</CardTitle>
                        <CardDescription>
                            Administra todos los servicios de la empresa
                        </CardDescription>
                    </div>
                    <AddServiceButton />
                </div>
            </CardHeader>
            <CardContent>
                <ServiceTable data={data} />
            </CardContent>
        </Card>
    )
}