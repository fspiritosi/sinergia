import { ROLES, type RoleName } from "./permissions";

/**
 * Mapping ruta → roles con acceso.
 * Usado por el middleware (edge runtime) — por eso solo chequea rol, no permiso
 * granular. El permiso fino se valida en server actions.
 *
 * Las rutas se matchean por prefijo: "/dashboard/clientes" cubre también
 * "/dashboard/clientes/:id", "/dashboard/clientes/:id/edit", etc.
 *
 * Una ruta que no aparece acá es accesible para cualquier usuario autenticado
 * (dashboard raíz y cualquier módulo no listado).
 */
export const ROUTE_GUARDS: Record<string, RoleName[]> = {
  "/dashboard/clientes": [ROLES.ADMIN],
  "/dashboard/servicios": [ROLES.ADMIN],
  "/dashboard/items": [ROLES.ADMIN],
  "/dashboard/tipos-informe": [ROLES.ADMIN],
  "/dashboard/tipos-variante": [ROLES.ADMIN],
  "/dashboard/detalles-variante": [ROLES.ADMIN],
  "/dashboard/condiciones": [ROLES.ADMIN],
  "/dashboard/usuarios": [ROLES.ADMIN],
  "/dashboard/roles": [ROLES.ADMIN],

  "/dashboard/propuestas": [ROLES.ADMIN, ROLES.GERENTE, ROLES.LECTURA],
  // Las propuestas también viven anidadas bajo /clientes — sobreescribe el
  // guard de /dashboard/clientes (admin) gracias al match por prefijo más largo.
  "/dashboard/clientes/propuestas": [ROLES.ADMIN, ROLES.GERENTE, ROLES.LECTURA],

  "/dashboard/planes": [ROLES.ADMIN, ROLES.GERENTE, ROLES.TECNICO, ROLES.LECTURA],
  "/dashboard/planificacion": [ROLES.ADMIN, ROLES.GERENTE, ROLES.TECNICO, ROLES.LECTURA],
  "/dashboard/informes": [ROLES.ADMIN, ROLES.GERENTE, ROLES.TECNICO, ROLES.LECTURA],
  "/dashboard/inspecciones": [ROLES.ADMIN, ROLES.GERENTE, ROLES.TECNICO, ROLES.LECTURA],
};

/**
 * Dado un pathname, devuelve los roles permitidos o `null` si la ruta es libre
 * (cualquier usuario autenticado).
 */
export function getAllowedRoles(pathname: string): RoleName[] | null {
  const entries = Object.entries(ROUTE_GUARDS).sort((a, b) => b[0].length - a[0].length);

  for (const [prefix, roles] of entries) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return roles;
    }
  }

  return null;
}
