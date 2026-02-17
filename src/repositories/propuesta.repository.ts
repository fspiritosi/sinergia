import { PropuestaTecnica, PropuestaStatus } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

/**
 * Type for creating a PropuestaTecnica
 */
export type PropuestaCreateInput = {
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia?: Date | null;
  status?: PropuestaStatus;
  items?: string[];
  valor?: number;
  moneda?: string;
  contacto?: string | null;
  is_active?: boolean;
  condicionesParticulares?: string[];
};

/**
 * Type for updating a PropuestaTecnica
 */
export type PropuestaUpdateInput = Partial<PropuestaCreateInput>;

/**
 * Propuesta Técnica Repository
 * Handles all data access operations for PropuestaTecnica entity
 */
export class PropuestaRepository extends BaseRepository<
  PropuestaTecnica,
  PropuestaCreateInput,
  PropuestaUpdateInput
> {
  protected modelName = "PropuestaTecnica";

  protected getDelegate() {
    return this.prisma.propuestaTecnica;
  }

  protected getDefaultInclude() {
    return {
      cliente: true,
      servicios: true,
    };
  }

  protected getDefaultOrderBy() {
    return [
      { is_active: "desc" as const },
      { createdAt: "desc" as const },
    ];
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { codigo: { contains: search, mode: "insensitive" as const } },
        { cliente: { name: { contains: search, mode: "insensitive" as const } } },
        { contacto: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  /**
   * Find a propuesta by codigo (unique identifier)
   */
  async findByCodigo(codigo: string): Promise<PropuestaTecnica | null> {
    try {
      return await this.prisma.propuestaTecnica.findUnique({
        where: { codigo },
        include: this.getDefaultInclude(),
      });
    } catch (error) {
      dbLogger.error(
        { error, codigo },
        "Error finding propuesta by codigo"
      );
      throw error;
    }
  }

  /**
   * Find propuestas by cliente ID
   */
  async findByClienteId(clienteId: string): Promise<PropuestaTecnica[]> {
    return this.findMany({
      where: { clienteId },
    });
  }

  /**
   * Find propuestas by status
   */
  async findByStatus(status: PropuestaStatus): Promise<PropuestaTecnica[]> {
    return this.findMany({
      where: { status },
    });
  }

  /**
   * Find all active propuestas
   */
  async findActive(): Promise<PropuestaTecnica[]> {
    return this.findMany({
      where: { is_active: true },
    });
  }

  /**
   * Find propuestas by cliente ID with full details
   */
  async findByClienteIdWithDetails(
    clienteId: string
  ): Promise<PropuestaTecnica[]> {
    try {
      return await this.prisma.propuestaTecnica.findMany({
        where: { clienteId },
        include: {
          cliente: true,
          servicios: true,
          informes: true,
          planesTrabajo: true,
        },
        orderBy: this.getDefaultOrderBy(),
      });
    } catch (error) {
      dbLogger.error(
        { error, clienteId },
        "Error finding propuestas by cliente ID with details"
      );
      throw error;
    }
  }

  /**
   * Update propuesta status
   */
  async updateStatus(
    id: string,
    status: PropuestaStatus
  ): Promise<PropuestaTecnica> {
    return this.update(id, { status });
  }

  /**
   * Find propuestas with pagination and filters
   */
  async findPaginatedWithFilters(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: PropuestaStatus;
    clienteId?: string;
    is_active?: boolean;
  }): Promise<any> {
    const filters: any = {};

    if (params.status) {
      filters.status = params.status;
    }

    if (params.clienteId) {
      filters.clienteId = params.clienteId;
    }

    if (params.is_active !== undefined) {
      filters.is_active = params.is_active;
    }

    return this.findPaginated({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      filters,
    });
  }
}

// Export a singleton instance
export const propuestaRepository = new PropuestaRepository();
