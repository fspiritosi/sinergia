import { PlanTrabajo, PlanTrabajoEstado } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";

/**
 * Type for creating a PlanTrabajo
 */
export type PlanTrabajoCreateInput = {
  clienteId: string;
  propuestaId: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado?: PlanTrabajoEstado;
};

/**
 * Type for updating a PlanTrabajo
 */
export type PlanTrabajoUpdateInput = Partial<PlanTrabajoCreateInput>;

/**
 * Plan de Trabajo Repository
 * Handles all data access operations for PlanTrabajo entity
 */
export class PlanTrabajoRepository extends BaseRepository<
  PlanTrabajo,
  PlanTrabajoCreateInput,
  PlanTrabajoUpdateInput
> {
  protected modelName = "PlanTrabajo";

  protected getDelegate() {
    return this.prisma.planTrabajo;
  }

  protected getDefaultInclude() {
    return {
      cliente: true,
      propuesta: {
        include: {
          servicios: true,
        },
      },
      programaciones: {
        include: {
          item: true,
          clientLocation: true,
          informe: true,
          detalleVariante: true,
        },
      },
    };
  }

  protected getDefaultOrderBy() {
    return [{ createdAt: "desc" as const }];
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { cliente: { name: { contains: search, mode: "insensitive" as const } } },
        { propuesta: { codigo: { contains: search, mode: "insensitive" as const } } },
      ],
    };
  }

  /**
   * Find planes de trabajo by cliente ID
   */
  async findByClienteId(clienteId: string): Promise<PlanTrabajo[]> {
    return this.findMany({
      where: { clienteId },
    });
  }

  /**
   * Find planes de trabajo by propuesta ID
   */
  async findByPropuestaId(propuestaId: string): Promise<PlanTrabajo[]> {
    return this.findMany({
      where: { propuestaId },
    });
  }

  /**
   * Find planes de trabajo by estado
   */
  async findByEstado(estado: PlanTrabajoEstado): Promise<PlanTrabajo[]> {
    return this.findMany({
      where: { estado },
    });
  }

  /**
   * Find planes de trabajo within a date range
   */
  async findByDateRange(fechaInicio: Date, fechaFin: Date): Promise<PlanTrabajo[]> {
    try {
      return await this.prisma.planTrabajo.findMany({
        where: {
          OR: [
            {
              fechaInicio: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
            {
              fechaFin: {
                gte: fechaInicio,
                lte: fechaFin,
              },
            },
            {
              AND: [{ fechaInicio: { lte: fechaInicio } }, { fechaFin: { gte: fechaFin } }],
            },
          ],
        },
        include: this.getDefaultInclude(),
        orderBy: this.getDefaultOrderBy(),
      });
    } catch (error) {
      dbLogger.error(
        { error, fechaInicio, fechaFin },
        "Error finding planes de trabajo by date range"
      );
      throw error;
    }
  }

  /**
   * Update plan de trabajo estado
   */
  async updateEstado(id: string, estado: PlanTrabajoEstado): Promise<PlanTrabajo> {
    return this.update(id, { estado });
  }

  /**
   * Find planes de trabajo with pagination and filters
   */
  async findPaginatedWithFilters(params: {
    page: number;
    pageSize: number;
    search?: string;
    estado?: PlanTrabajoEstado;
    clienteId?: string;
    propuestaId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<any> {
    const filters: any = {};

    if (params.estado) {
      filters.estado = params.estado;
    }

    if (params.clienteId) {
      filters.clienteId = params.clienteId;
    }

    if (params.propuestaId) {
      filters.propuestaId = params.propuestaId;
    }

    if (params.fechaInicio) {
      filters.fechaInicio = {
        gte: params.fechaInicio,
      };
    }

    if (params.fechaFin) {
      filters.fechaFin = {
        lte: params.fechaFin,
      };
    }

    return this.findPaginated({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      filters,
    });
  }

  /**
   * Get plan de trabajo with detailed programaciones
   */
  async findByIdWithFullDetails(id: string): Promise<PlanTrabajo | null> {
    try {
      return await this.prisma.planTrabajo.findUnique({
        where: { id },
        include: {
          cliente: {
            include: {
              provincia: true,
              ciudad: true,
            },
          },
          propuesta: {
            include: {
              cliente: true,
              servicios: true,
            },
          },
          programaciones: {
            include: {
              item: {
                include: {
                  variantType: {
                    include: {
                      detalles: true,
                    },
                  },
                },
              },
              clientLocation: {
                include: {
                  provincia: true,
                  ciudad: true,
                },
              },
              informe: {
                include: {
                  tipoDeInforme: true,
                },
              },
              detalleVariante: true,
            },
            orderBy: {
              fechaProgramada: "asc",
            },
          },
        },
      });
    } catch (error) {
      dbLogger.error({ error, id }, "Error finding plan de trabajo by ID with full details");
      throw error;
    }
  }
}

// Export a singleton instance
export const planTrabajoRepository = new PlanTrabajoRepository();
