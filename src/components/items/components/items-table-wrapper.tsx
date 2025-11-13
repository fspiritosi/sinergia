import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ItemsTable } from './items-table'
import { AddItemButton } from './add-item-button'
import { Items, Servicio } from "@/generated/client"
import { AsignItemButton } from './asign-item-button'

interface ItemsTableWrapperProps {
    data: Items[]
}



export function ItemsTableWrapper({ data }: ItemsTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Items</CardTitle>
                        <CardDescription>
                            Administra todos los items de la empresa
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                    <AsignItemButton />
                    <AddItemButton />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ItemsTable data={data} />
            </CardContent>
        </Card>
    )
}