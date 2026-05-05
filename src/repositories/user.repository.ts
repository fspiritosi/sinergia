import { User } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

export type UserCreateInput = {
  clerkId: string;
  email: string;
  name?: string | null;
  roleId: string;
  isActive?: boolean;
};

export type UserUpdateInput = Partial<Omit<UserCreateInput, "clerkId">>;

export class UserRepository extends BaseRepository<User, UserCreateInput, UserUpdateInput> {
  protected modelName = "User";

  protected getDelegate() {
    return this.prisma.user;
  }

  protected getDefaultInclude() {
    return {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    };
  }

  protected getDefaultOrderBy() {
    return [{ isActive: "desc" as const }, { createdAt: "desc" as const }];
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { email: { contains: search, mode: "insensitive" as const } },
        { name: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  async findByClerkId(clerkId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { clerkId },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error({ error, clerkId }, "Error finding user by clerkId");
      throw error;
    }
  }

  async upsertFromClerk(data: {
    clerkId: string;
    email: string;
    name?: string | null;
    roleId: string;
    isActive?: boolean;
  }) {
    try {
      return await this.prisma.user.upsert({
        where: { clerkId: data.clerkId },
        update: {
          email: data.email,
          name: data.name ?? null,
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        create: {
          clerkId: data.clerkId,
          email: data.email,
          name: data.name ?? null,
          roleId: data.roleId,
          isActive: data.isActive ?? true,
        },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error({ error, clerkId: data.clerkId }, "Error upserting user from Clerk");
      throw error;
    }
  }

  async setRole(userId: string, roleId: string) {
    try {
      return await this.update(userId, { roleId });
    } catch (error) {
      dbLogger.error({ error, userId, roleId }, "Error setting user role");
      throw error;
    }
  }

  async deactivateByClerkId(clerkId: string) {
    try {
      return await this.prisma.user.update({
        where: { clerkId },
        data: { isActive: false },
      });
    } catch (error) {
      dbLogger.error({ error, clerkId }, "Error deactivating user");
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
