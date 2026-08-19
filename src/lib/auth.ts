import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth as betterAuth } from "@/lib/auth-server";
import { userRepository } from "@/repositories/user.repository";
import { ROLES } from "@/lib/rbac/permissions";

export const DEFAULT_ROLE_NAME = ROLES.LECTURA;
export const ADMIN_ROLE_NAME = ROLES.ADMIN;

/**
 * Usuario de la sesión actual, con su rol y permisos resueltos desde la DB.
 *
 * Contrato idéntico al de la versión con Clerk a propósito: `requirePermission`,
 * `requireRole`, `hasPermission` y los layouts que arman el PermissionsProvider
 * dependen de esta función, así que mantener nombre y forma de retorno deja sin
 * tocar las ~62 llamadas repartidas por los archivos de actions.
 *
 * A diferencia de la versión con Clerk, ya no hace falta el bootstrap
 * on-demand: better-auth escribe el usuario en nuestra propia tabla `User` al
 * momento del alta, así que cuando hay sesión la fila siempre existe. Eso
 * elimina de paso la condición de carrera que había entre ese bootstrap y el
 * webhook `user.created`.
 *
 * Cacheado por request con `React.cache`.
 */
export const getCurrentDbUser = cache(async () => {
  const session = await betterAuth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  return userRepository.findByIdWithPermissions(session.user.id);
});

export const getCurrentUserPermissions = cache(async () => {
  const user = await getCurrentDbUser();
  if (!user) return { role: null as string | null, codes: [] as string[] };

  const codes = user.role.permissions.map((rp) => rp.permission.code);
  return { role: user.role.name, codes };
});
