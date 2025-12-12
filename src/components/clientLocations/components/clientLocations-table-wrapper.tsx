import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientLocationsTable } from './clientLocations-table'
import { AddClientLocationsButton } from './add-clientLocations-button'
import {clientLocations} from './actions'

interface TiposInformeTableWrapperProps {
    data: clientLocations[]
}

export function TiposInformeTableWrapper({ data }: TiposInformeTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Locaciones de Clientes</CardTitle>
                        <CardDescription>
                            Administra todas las locaciones de los Clientes
                        </CardDescription>
                    </div>
                    <AddClientLocationsButton />
                </div>
            </CardHeader>
            <CardContent>
                <ClientLocationsTable data={data} />
            </CardContent>
        </Card>
    )
}