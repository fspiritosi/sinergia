"use server";

import prisma from "@/lib/db";
import { roleRepository } from "@/repositories/role.repository";
import {
  toRoleWithPermissionsDto,
  toPermissionDto,
  type RoleWithPermissionsDto,
  type PermissionDto,
} from "@/dtos/role.dto";

export async function getRoles(): Promise<RoleWithPermissionsDto[]> {
  const roles = await roleRepository.findMany();
  return roles.map((r) =>
    toRoleWithPermissionsDto(r as unknown as Parameters<typeof toRoleWithPermissionsDto>[0])
  );
}

export async function getRoleById(id: string): Promise<RoleWithPermissionsDto | null> {
  const role = await roleRepository.findById(id);
  if (!role) return null;
  return toRoleWithPermissionsDto(
    role as unknown as Parameters<typeof toRoleWithPermissionsDto>[0]
  );
}

export async function getAllPermissions(): Promise<PermissionDto[]> {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
  return permissions.map(toPermissionDto);
}
