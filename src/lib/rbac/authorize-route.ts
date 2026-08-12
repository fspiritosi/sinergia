import { getAllowedRoles } from "@/lib/rbac/route-guards";
import type { RoleName } from "@/lib/rbac/permissions";

/**
 * ¿Este rol puede entrar a esta ruta?
 *
 * Extrae la decisión que antes vivía embebida en el middleware de Clerk
 * (`src/proxy.ts`, que leía el rol del session token). Ahora el middleware no
 * conoce el rol —no toca la DB— y la decisión la toma el layout del dashboard,
 * que de todas formas ya carga los permisos del usuario.
 *
 * `getAllowedRoles` devuelve `null` para rutas no listadas en ROUTE_GUARDS, que
 * por convención del proyecto significa "cualquier usuario autenticado".
 */
export function isRoleAllowedForRoute(pathname: string, role: string | null): boolean {
  const allowed = getAllowedRoles(pathname);
  if (allowed === null) return true;
  if (!role) return false;
  return (allowed as readonly RoleName[]).includes(role as RoleName);
}
