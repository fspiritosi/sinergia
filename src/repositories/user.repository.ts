import { User } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

export type UserCreateInput = {
  /** Opcional: sólo lo tienen los usuarios previos a la migración a better-auth. */
  clerkId?: string | null;
  email: string;
  name?: string | null;
  roleId: string;
  isActive?: boolean;
  emailVerified?: boolean;
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

  /**
   * Usuario con su rol y permisos resueltos. Es la consulta que hace
   * `getCurrentDbUser()` en cada request, ahora que la identidad la provee
   * better-auth y `User.id` es la clave de la sesión.
   *
   * Existe además de `findById` de BaseRepository porque aquél devuelve el
   * tipo `User` plano y perdería el tipado de `role.permissions`.
   */
  async findByIdWithPermissions(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error({ error, userId: id }, "Error finding user by id");
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      dbLogger.error({ error, email }, "Error finding user by email");
      throw error;
    }
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

  /**
   * Alta por invitación desde el panel de administración.
   *
   * Crea el `User` y su fila `Account` de credenciales en una sola transacción:
   * si quedara un usuario sin `Account`, better-auth no podría enviarle el
   * enlace para definir la contraseña y el alta sería irrecuperable desde la UI.
   *
   * `emailVerified: true` porque el invitado sólo puede completar el alta desde
   * el enlace que le llega a esa casilla: eso ya prueba que la controla. Es el
   * mismo criterio que usaba Clerk al consumir el ticket de invitación.
   */
  async createInvited(data: {
    email: string;
    name: string | null;
    roleId: string;
    passwordHash: string;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            name: data.name,
            roleId: data.roleId,
            emailVerified: true,
            isActive: true,
          },
        });

        await tx.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: data.passwordHash,
          },
        });

        return user;
      });
    } catch (error) {
      dbLogger.error({ error, email: data.email }, "Error creando usuario invitado");
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
