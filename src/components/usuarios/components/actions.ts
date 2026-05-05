"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import { authLogger } from "@/lib/logger";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { roleRepository } from "@/repositories/role.repository";
import { userRepository } from "@/repositories/user.repository";
import { toRoleSummaryDto, type RoleSummaryDto } from "@/dtos/role.dto";

export type AppUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleName: string | null;
  roleLabel: string | null;
  is_active: boolean;
  createdAt: string; // ISO
};

type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
};

export async function getRolesForSelect(): Promise<RoleSummaryDto[]> {
  const roles = await roleRepository.findMany();
  return roles.map(toRoleSummaryDto);
}

export async function createUserAction(data: CreateUserPayload): Promise<void> {
  await requirePermission(PERMISSIONS.USUARIOS_INVITE);

  const email = data.email?.trim() ?? "";
  if (!email) {
    throw new Error("El email es obligatorio");
  }

  const role = await roleRepository.findById(data.roleId);
  if (!role) {
    throw new Error("El rol seleccionado no existe");
  }

  const client = await clerkClient();

  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      publicMetadata: {
        role: role.name,
      },
    });
  } catch (error: unknown) {
    authLogger.error({ error, email }, "Error al crear usuario en Clerk");

    const anyError = error as any;
    const firstMessage =
      anyError?.errors?.[0]?.message ||
      anyError?.errors?.[0]?.code ||
      anyError?.message ||
      "Error desconocido al crear usuario";

    throw new Error(String(firstMessage));
  }
}

export const getUsers = async (): Promise<AppUser[]> => {
  await requirePermission(PERMISSIONS.USUARIOS_VIEW);

  const client = await clerkClient();
  const users = await client.users.getUserList({ limit: 50 });

  // Una sola query a la DB para resolver los roles legibles desde la tabla User
  const dbUsers = await userRepository.findMany({
    where: { clerkId: { in: users.data.map((u) => u.id) } },
  });
  const byClerkId = new Map(
    (
      dbUsers as unknown as Array<{
        clerkId: string;
        role: { name: string; label: string };
      }>
    ).map((u) => [u.clerkId, u.role])
  );

  return users.data.map((user) => {
    const primaryEmail =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";

    const dbRole = byClerkId.get(user.id);
    const metadataRole =
      typeof user.publicMetadata?.role === "string" ? (user.publicMetadata.role as string) : null;

    return {
      id: user.id,
      email: primaryEmail,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      roleName: dbRole?.name ?? metadataRole,
      roleLabel: dbRole?.label ?? metadataRole,
      is_active: !user.banned && !user.locked,
      createdAt: new Date(user.createdAt).toISOString(),
    };
  });
};
