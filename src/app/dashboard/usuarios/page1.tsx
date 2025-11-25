import { createUserAction } from "@/app/dashboard/usuarios/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clerkClient, type User } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 50 });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios con acceso al sistema y sus roles
            </CardDescription>
          </div>
          <form action={createUserAction} className="space-y-3 w-full max-w-md">
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium" htmlFor="firstName">
                  Nombre
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium" htmlFor="lastName">
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="role">
                Rol
              </label>
              <select
                id="role"
                name="role"
                className="w-full rounded-md border px-3 py-2 text-sm"
                defaultValue="user"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Invitar usuario
            </button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((user: User) => {
                const primaryEmail =
                  user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "-";
                const role = (user.publicMetadata as Record<string, unknown>)?.role ?? "-";

                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">
                      {user.firstName || user.lastName
                        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                        : "Sin nombre"}
                    </td>
                    <td className="px-4 py-2">{primaryEmail}</td>
                    <td className="px-4 py-2 capitalize">{String(role)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
