import { Cliente } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

/**
 * Type for creating a Cliente
 */
export type ClienteCreateInput = {
  name: string;
  cuit: string;
  email: string;
  telefono: string;
  domicilio: string;
  provinciaId?: string | null;
  ciudadId?: string | null;
  is_active?: boolean;
};

/**
 * Type for updating a Cliente
 */
export type ClienteUpdateInput = Partial<ClienteCreateInput>;

/**
 * Cliente Repository
 * Handles all data access operations for Cliente entity
 */
export class ClienteRepository extends BaseRepository<
  Cliente,
  ClienteCreateInput,
  ClienteUpdateInput
> {
  protected modelName = "Cliente";

  protected getDelegate() {
    return this.prisma.cliente;
  }

  protected getDefaultInclude() {
    return {
      provincia: true,
      ciudad: true,
      clientLocations: {
        include: {
          provincia: true,
          ciudad: true,
        },
      },
    };
  }

  protected getDefaultOrderBy() {
    return [{ is_active: "desc" as const }, { name: "asc" as const }];
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { cuit: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  /**
   * Find a cliente by CUIT (unique identifier)
   */
  async findByCuit(cuit: string): Promise<Cliente | null> {
    try {
      return await this.prisma.cliente.findUnique({
        where: { cuit },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error(
        { error, cuit },
        "Error finding cliente by CUIT"
      );
      throw error;
    }
  }

  /**
   * Find a cliente by ID with full details including propuestas
   */
  async findByIdWithDetails(id: string): Promise<Cliente | null> {
    try {
      return await this.prisma.cliente.findUnique({
        where: { id },
        include: {
          provincia: true,
          ciudad: true,
          clientLocations: {
            include: {
              provincia: true,
              ciudad: true,
              cliente: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          propuestas: {
            include: {
              cliente: true,
              servicios: true,
            },
          },
        },
      });
    } catch (error) {
      dbLogger.error(
        { error, id },
        "Error finding cliente by ID with details"
      );
      throw error;
    }
  }

  /**
   * Find all active clientes
   */
  async findActive(): Promise<Cliente[]> {
    return this.findMany({
      where: { is_active: true },
    });
  }

  /**
   * Find all inactive clientes
   */
  async findInactive(): Promise<Cliente[]> {
    return this.findMany({
      where: { is_active: false },
    });
  }

  /**
   * Toggle cliente active status
   */
  async toggleActive(id: string): Promise<Cliente> {
    try {
      const cliente = await this.findById(id);
      if (!cliente) {
        throw new Error(`Cliente with ID ${id} not found`);
      }

      return this.update(id, {
        is_active: !cliente.is_active,
      });
    } catch (error) {
      dbLogger.error(
        { error, id },
        "Error toggling cliente active status"
      );
      throw error;
    }
  }
}

// Export a singleton instance
export const clienteRepository = new ClienteRepository();
