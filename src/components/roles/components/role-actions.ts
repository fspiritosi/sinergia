"use server";

import { revalidatePath } from "next/cache";
import { roleRepository } from "@/repositories/role.repository";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";

export async function updateRolePermissions(roleId: string, permissionCodes: string[]) {
  await requirePermission(PERMISSIONS.USUARIOS_MANAGE_ROLES);

  try {
    await roleRepository.setPermissions(roleId, permissionCodes);

    revalidatePath("/dashboard/roles");
    revalidatePath(`/dashboard/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, roleId }, "Error al actualizar permisos del rol");
    throw error;
  }
}

export async function updateRoleMetadata(
  roleId: string,
  data: { label: string; description?: string | null }
) {
  await requirePermission(PERMISSIONS.USUARIOS_MANAGE_ROLES);

  try {
    const existing = await roleRepository.findById(roleId);
    if (!existing) throw new Error("Rol no encontrado");

    if (existing.isSystem) {
      throw new Error(`No se puede modificar el rol de sistema "${existing.name}"`);
    }

    await roleRepository.update(roleId, {
      label: data.label,
      description: data.description ?? null,
    });

    revalidatePath("/dashboard/roles");
    revalidatePath(`/dashboard/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, roleId }, "Error al actualizar metadata del rol");
    throw error;
  }
}
