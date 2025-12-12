import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TipoInformeTable } from './tipoInforme-table'
import { AddServiceButton } from './add-tipoInforme-button'
import { TipoDeInforme } from "@/generated/client"

interface TiposInformeTableWrapperProps {
    data: TipoDeInforme[]
}

export function TiposInformeTableWrapper({ data }: TiposInformeTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Tipos de Informes</CardTitle>
                        <CardDescription>
                            Administra todos los tipos de informes de la empresa
                        </CardDescription>
                    </div>
                    <AddServiceButton />
                </div>
            </CardHeader>
            <CardContent>
                <TipoInformeTable data={data} />
            </CardContent>
        </Card>
    )
}