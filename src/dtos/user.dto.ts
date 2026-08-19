import type { User, Role, Permission, RolePermission } from "@/generated/client";
import { toRoleWithPermissionsDto, type RoleWithPermissionsDto } from "./role.dto";

export interface UserDto {
  id: string;
  /** Sólo lo tienen los usuarios previos a la migración a better-auth. */
  clerkId: string | null;
  email: string;
  name: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoleDto extends UserDto {
  role: RoleWithPermissionsDto;
}

export interface UserSummaryDto {
  id: string;
  /** Sólo lo tienen los usuarios previos a la migración a better-auth. */
  clerkId: string | null;
  email: string;
  name: string | null;
  roleName: string;
  roleLabel: string;
  isActive: boolean;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name ?? null,
    roleId: user.roleId,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toUserWithRoleDto(
  user: User & {
    role: Role & {
      permissions?: (RolePermission & { permission: Permission })[];
    };
  }
): UserWithRoleDto {
  return {
    ...toUserDto(user),
    role: toRoleWithPermissionsDto(user.role),
  };
}

export function toUserSummaryDto(
  user: User & { role: Pick<Role, "name" | "label"> }
): UserSummaryDto {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name ?? null,
    roleName: user.role.name,
    roleLabel: user.role.label,
    isActive: user.isActive,
  };
}

export function toUserDtos(users: User[]): UserDto[] {
  return users.map(toUserDto);
}
