import "server-only";
import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { authLogger } from "@/lib/logger";
import { userRepository } from "@/repositories/user.repository";
import { roleRepository } from "@/repositories/role.repository";

export const DEFAULT_ROLE_NAME = "lectura";
export const ADMIN_ROLE_NAME = "admin";

async function resolveRoleIdForBootstrap(metadataRole: string | null): Promise<string> {
  // Respeta cualquier rol válido del publicMetadata. Si no hay metadata o el
  // rol pedido no existe en la DB, cae al rol por defecto (lectura).
  if (metadataRole) {
    const role = await roleRepository.findByName(metadataRole);
    if (role) return role.id;
    authLogger.warn(
      { metadataRole },
      "Bootstrap: rol del metadata no existe en DB, usando default"
    );
  }

  const fallback = await roleRepository.findByName(DEFAULT_ROLE_NAME);
  if (!fallback) {
    throw new Error(`Rol "${DEFAULT_ROLE_NAME}" no encontrado. Asegurate de correr seed-rbac.`);
  }
  return fallback.id;
}

export const getCurrentDbUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await userRepository.findByClerkId(userId);
  if (existing) return existing;

  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    const primaryEmail =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;

    if (!primaryEmail) {
      authLogger.warn({ userId }, "Bootstrap user: sin email en Clerk, abortando");
      return null;
    }

    const metadataRole =
      typeof clerkUser.publicMetadata?.role === "string"
        ? (clerkUser.publicMetadata.role as string)
        : null;

    const roleId = await resolveRoleIdForBootstrap(metadataRole);

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    const created = await userRepository.upsertFromClerk({
      clerkId: userId,
      email: primaryEmail,
      name,
      roleId,
    });

    authLogger.info({ clerkId: userId, metadataRole }, "Bootstrap user: creado en DB");
    return created;
  } catch (error) {
    authLogger.error({ error, userId }, "Bootstrap user: error al sincronizar con Clerk");
    throw error;
  }
});

export const getCurrentUserPermissions = cache(async () => {
  const user = await getCurrentDbUser();
  if (!user) return { role: null as string | null, codes: [] as string[] };

  const codes = user.role.permissions.map((rp) => rp.permission.code);
  return { role: user.role.name, codes };
});
