import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RolePermissionsGrid } from "@/components/roles/components/role-permissions-grid";
import { getRoleById, getAllPermissions } from "@/components/roles/components/actions";

export const revalidate = 0;

export default async function RoleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [role, allPermissions] = await Promise.all([getRoleById(id), getAllPermissions()]);

  if (!role) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href="/dashboard/roles">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Volver
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{role.label}</h1>
            {role.isSystem ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Sistema
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{role.description ?? "Sin descripción"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Identificador interno: <code>{role.name}</code>
          </p>
        </div>
      </div>

      <RolePermissionsGrid role={role} allPermissions={allPermissions} />
    </div>
  );
}
