import Usuarios from "@/components/usuarios/Usuarios";

export const revalidate = 0;

export default function UsuariosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios del sistema. Asigná un rol al invitar un nuevo usuario.
        </p>
      </div>
      <Usuarios />
    </div>
  );
}
