import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserTable } from './user-table'
import { AddUserButton } from './add-user-button'
import { AppUser } from './actions'

interface UsersTableWrapperProps {
    data: AppUser[]
}

export function UsersTableWrapper({ data }: UsersTableWrapperProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Usuarios</CardTitle>
                        <CardDescription>
                            Administra todos los usuarios de la empresa
                        </CardDescription>
                    </div>
                    <AddUserButton />
                </div>
            </CardHeader>
            <CardContent>
                <UserTable data={data} />
            </CardContent>
        </Card>
    )
}