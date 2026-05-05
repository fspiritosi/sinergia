import { Roles } from "@/components/roles/Roles";

export const revalidate = 0;

export default function RolesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Roles y permisos</h1>
        <p className="text-sm text-muted-foreground">
          Gestioná qué puede hacer cada rol del sistema. Los roles marcados como &quot;Sistema&quot;
          no se pueden modificar.
        </p>
      </div>
      <Roles />
    </div>
  );
}
