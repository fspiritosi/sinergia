import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientesTable } from './clientes-table'
import { AddClienteButton } from './add-cliente-button'
import { Cliente } from './actions'

interface ClientesTableWrapperProps {
    data: Cliente[]
}

export function ClientesTableWrapper({ data }: ClientesTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Clientes</CardTitle>
                        <CardDescription>
                            Administra todos los clientes de la empresa
                        </CardDescription>
                    </div>
                    <AddClienteButton />
                </div>
            </CardHeader>
            <CardContent>
                <ClientesTable data={data} />
            </CardContent>
        </Card>
    )
}