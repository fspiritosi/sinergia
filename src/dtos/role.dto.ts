import type { Role, Permission, RolePermission } from "@/generated/client";

export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
}

export interface RoleDto {
  id: string;
  name: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithPermissionsDto extends RoleDto {
  permissions: PermissionDto[];
  usersCount?: number;
}

export interface RoleSummaryDto {
  id: string;
  name: string;
  label: string;
  isSystem: boolean;
}

export function toPermissionDto(permission: Permission): PermissionDto {
  return {
    id: permission.id,
    code: permission.code,
    module: permission.module,
    action: permission.action,
    description: permission.description,
  };
}

export function toRoleDto(role: Role): RoleDto {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    description: role.description ?? null,
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function toRoleWithPermissionsDto(
  role: Role & {
    permissions?: (RolePermission & { permission: Permission })[];
    _count?: { users: number };
  }
): RoleWithPermissionsDto {
  return {
    ...toRoleDto(role),
    permissions: role.permissions?.map((rp) => toPermissionDto(rp.permission)) ?? [],
    usersCount: role._count?.users,
  };
}

export function toRoleSummaryDto(role: Role): RoleSummaryDto {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    isSystem: role.isSystem,
  };
}

export function toRoleDtos(roles: Role[]): RoleDto[] {
  return roles.map(toRoleDto);
}

export function toRoleSummaryDtos(roles: Role[]): RoleSummaryDto[] {
  return roles.map(toRoleSummaryDto);
}
