import { Role } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

export type RoleCreateInput = {
  name: string;
  label: string;
  description?: string | null;
  isSystem?: boolean;
};

export type RoleUpdateInput = Partial<RoleCreateInput>;

export class RoleRepository extends BaseRepository<Role, RoleCreateInput, RoleUpdateInput> {
  protected modelName = "Role";

  protected getDelegate() {
    return this.prisma.role;
  }

  protected getDefaultInclude() {
    return {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    };
  }

  protected getDefaultOrderBy() {
    return [{ isSystem: "desc" as const }, { name: "asc" as const }];
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { label: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  async findByName(name: string) {
    try {
      return await this.prisma.role.findUnique({
        where: { name },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error({ error, name }, "Error finding role by name");
      throw error;
    }
  }

  async setPermissions(roleId: string, permissionCodes: string[]) {
    try {
      const role = await this.prisma.role.findUniqueOrThrow({
        where: { id: roleId },
      });

      if (role.isSystem) {
        throw new Error(`No se pueden modificar los permisos del rol de sistema "${role.name}"`);
      }

      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
        select: { id: true },
      });

      if (permissions.length !== permissionCodes.length) {
        throw new Error("Algunos códigos de permiso no existen");
      }

      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        this.prisma.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId, permissionId: p.id })),
          skipDuplicates: true,
        }),
      ]);

      dbLogger.info({ roleId, count: permissions.length }, "Role permissions updated");
    } catch (error) {
      dbLogger.error({ error, roleId }, "Error setting role permissions");
      throw error;
    }
  }
}

export const roleRepository = new RoleRepository();
