import "server-only";
import { getCurrentDbUser } from "@/lib/auth";
import { authLogger } from "@/lib/logger";
import type { PermissionCode, RoleName } from "./permissions";

export class ForbiddenError extends Error {
  readonly code: string;

  constructor(requiredCode: string) {
    super("No tenés permisos para realizar esta acción.");
    this.code = requiredCode;
    this.name = "ForbiddenError";
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Sesión inválida o expirada");
    this.name = "UnauthenticatedError";
  }
}

export async function requirePermission(permission: PermissionCode) {
  const user = await getCurrentDbUser();
  if (!user) throw new UnauthenticatedError();

  // Se loguea userId (el uuid de User) y no clerkId: desde la migración a
  // better-auth, clerkId sólo lo conservan los usuarios previos, así que en
  // todo usuario nuevo vendría null y estos avisos de seguridad quedarían sin
  // identificar a quién se le negó el acceso.
  if (!user.isActive) {
    authLogger.warn({ userId: user.id, permission }, "Acceso denegado: usuario inactivo");
    throw new ForbiddenError(permission);
  }

  const has = user.role.permissions.some((rp) => rp.permission.code === permission);

  if (!has) {
    authLogger.warn(
      { userId: user.id, role: user.role.name, permission },
      "Acceso denegado: permiso faltante"
    );
    throw new ForbiddenError(permission);
  }

  return user;
}

export async function requireRole(...roles: RoleName[]) {
  const user = await getCurrentDbUser();
  if (!user) throw new UnauthenticatedError();

  if (!user.isActive || !roles.includes(user.role.name as RoleName)) {
    authLogger.warn(
      { userId: user.id, role: user.role.name, roles },
      "Acceso denegado: rol no permitido"
    );
    throw new ForbiddenError(roles.join(","));
  }

  return user;
}

export async function hasPermission(permission: PermissionCode): Promise<boolean> {
  const user = await getCurrentDbUser();
  if (!user || !user.isActive) return false;
  return user.role.permissions.some((rp) => rp.permission.code === permission);
}
