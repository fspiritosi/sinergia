"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth-server";
import { tomarFalloDeEnvio } from "@/lib/mailer";
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
  roleId: string | null;
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
  // Era la única acción del módulo sin chequeo. Lo que expone es menor (los
  // nombres de los roles), pero una server action es un endpoint público:
  // sin esto, cualquier usuario autenticado puede llamarla.
  await requirePermission(PERMISSIONS.USUARIOS_VIEW);

  const roles = await roleRepository.findMany();
  return roles.map(toRoleSummaryDto);
}

/**
 * Dispara el correo con el enlace a /set-password (ver `sendResetPassword` en
 * auth-server.ts) y se asegura de que haya salido de verdad.
 *
 * El chequeo no es paranoia: better-auth atrapa la excepción de su callback de
 * envío y devuelve `status: true` igual, así que sin `tomarFalloDeEnvio()` un
 * SMTP caído se ve exactamente igual que un envío exitoso.
 */
async function enviarInvitacion(email: string): Promise<void> {
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/set-password" },
  });

  const fallo = tomarFalloDeEnvio(email);
  if (fallo) {
    throw new Error(`No se pudo enviar el correo: ${fallo}`);
  }
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

  const yaExiste = await userRepository.findByEmail(email);
  if (yaExiste) {
    throw new Error("Ya existe un usuario con ese email");
  }

  try {
    // Contraseña aleatoria que nadie conoce ni se comunica: es sólo un relleno
    // para que exista la fila Account. El usuario define la suya desde el
    // enlace del correo.
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

    const user = await userRepository.createInvited({
      email,
      name: [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(" ") || null,
      roleId: role.id,
      passwordHash,
    });

    try {
      await enviarInvitacion(email);
    } catch (error: unknown) {
      // El usuario ya quedó creado y eso no se deshace: borrarlo acá dejaría al
      // admin sin nada, y el alta en sí salió bien. Lo que corresponde es
      // decirle qué pasó y que reintente el envío con "Reenviar invitación".
      authLogger.error({ error, email }, "Usuario creado pero falló el envío de la invitación");
      revalidatePath("/dashboard/usuarios");
      throw new Error(
        `El usuario se creó, pero no se pudo enviar la invitación. ` +
          `${error instanceof Error ? error.message : String(error)}. ` +
          `Una vez resuelto, usá "Reenviar invitación" desde la fila del usuario.`
      );
    }

    authLogger.info({ userId: user.id, email, role: role.name }, "Usuario invitado");
    revalidatePath("/dashboard/usuarios");
  } catch (error: unknown) {
    authLogger.error({ error, email }, "Error al crear usuario");
    throw error instanceof Error ? error : new Error("Error desconocido al crear usuario");
  }
}

/**
 * Reenvía la invitación a un usuario que ya existe.
 *
 * Sin esto, un alta cuyo correo no llegó quedaba en un callejón sin salida:
 * volver a invitarlo choca contra "Ya existe un usuario con ese email" y ese
 * camino ni siquiera intenta el envío.
 */
export async function resendInvitationAction(userId: string): Promise<void> {
  await requirePermission(PERMISSIONS.USUARIOS_INVITE);

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("El usuario no existe");
  }

  try {
    await enviarInvitacion(user.email);
    authLogger.info({ userId, email: user.email }, "Invitación reenviada");
  } catch (error: unknown) {
    authLogger.error({ error, userId, email: user.email }, "Error al reenviar la invitación");
    throw error instanceof Error ? error : new Error("Error al reenviar la invitación");
  }
}

/**
 * Los usuarios ahora viven enteramente en nuestra base: antes la lista salía de
 * Clerk (`getUserList({ limit: 50 })`, sin paginar, así que a partir del
 * usuario 51 desaparecían de la UI en silencio) y se le pegaba el rol desde la
 * DB. Con better-auth la DB es la única fuente de verdad y ese tope desaparece.
 */
export const getUsers = async (): Promise<AppUser[]> => {
  await requirePermission(PERMISSIONS.USUARIOS_VIEW);

  const users = (await userRepository.findMany()) as unknown as Array<{
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    createdAt: Date;
    role: { id: string; name: string; label: string } | null;
  }>;

  return users.map((user) => {
    // `AppUser` expone firstName/lastName por separado, pero la tabla guarda un
    // único `name`. Se parte por el primer espacio, igual que se compone al
    // crear el usuario.
    const partes = user.name?.trim().split(/\s+/) ?? [];
    const firstName = partes.length > 0 ? partes[0] : null;
    const lastName = partes.length > 1 ? partes.slice(1).join(" ") : null;

    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      roleId: user.role?.id ?? null,
      roleName: user.role?.name ?? null,
      roleLabel: user.role?.label ?? null,
      is_active: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  });
};

/**
 * Actualiza el rol de un usuario (solo admins con USUARIOS_MANAGE_ROLES).
 *
 * Antes había que escribir en dos lados —`publicMetadata` de Clerk para que lo
 * viera el middleware, y `User.roleId` para el RBAC— con el riesgo de que
 * quedaran desincronizados si fallaba una de las dos escrituras. Ahora el rol
 * vive sólo en la base.
 *
 * `userId` es `User.id` (antes era el id de Clerk).
 */
export async function updateUserRole(data: { userId: string; roleId: string }): Promise<void> {
  await requirePermission(PERMISSIONS.USUARIOS_MANAGE_ROLES);

  const role = await roleRepository.findById(data.roleId);
  if (!role) {
    throw new Error("El rol seleccionado no existe");
  }

  try {
    await userRepository.setRole(data.userId, data.roleId);
    authLogger.info({ userId: data.userId, role: role.name }, "Rol actualizado");
    revalidatePath("/dashboard/usuarios");
  } catch (error: unknown) {
    authLogger.error({ error, userId: data.userId, roleId: data.roleId }, "Error al cambiar rol");
    throw error instanceof Error ? error : new Error("Error al cambiar el rol del usuario");
  }
}
