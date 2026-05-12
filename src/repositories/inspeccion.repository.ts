import { InspeccionFormulario } from "@/generated/client";
import { BaseRepository } from "./base.repository";
import { dbLogger } from "@/lib/logger";
import prisma from "@/lib/db";

export type InspeccionCreateInput = {
  clienteId: string;
  tipo: "inspeccion_base" | "inspeccion_equipo";
  realizadoPorId: string;
  clientLocationId?: string | null;
  lugarTexto?: string | null;
  informeId?: string | null;
};

export type InspeccionUpdateInput = Partial<
  Omit<InspeccionCreateInput, "realizadoPorId" | "clienteId">
> & {
  estado?: "borrador" | "completada";
};

export class InspeccionRepository extends BaseRepository<
  InspeccionFormulario,
  InspeccionCreateInput,
  InspeccionUpdateInput
> {
  protected modelName = "InspeccionFormulario";

  protected getDelegate() {
    return this.prisma.inspeccionFormulario;
  }

  protected getDefaultInclude() {
    return {
      cliente: { select: { id: true, name: true } },
      realizadoPor: { select: { id: true, name: true, email: true } },
      clientLocation: { select: { id: true, name: true } },
      informe: { select: { id: true, estado: true } },
    };
  }

  protected getDefaultOrderBy() {
    return { fecha: "desc" as const };
  }

  protected buildSearchWhere(search: string) {
    return {
      OR: [
        { cliente: { name: { contains: search, mode: "insensitive" as const } } },
        { lugarTexto: { contains: search, mode: "insensitive" as const } },
      ],
    };
  }

  async findByIdWithRespuestas(id: string) {
    try {
      return await this.prisma.inspeccionFormulario.findUnique({
        where: { id },
        include: {
          ...this.getDefaultInclude(),
          respuestas: {
            include: {
              pregunta: true,
              accionesSeleccionadas: {
                include: { accion: true },
              },
            },
          },
        },
      });
    } catch (error) {
      dbLogger.error({ error, id }, "Error finding inspeccion with respuestas");
      throw error;
    }
  }

  async findBorradorByUser(userId: string) {
    try {
      return await this.prisma.inspeccionFormulario.findMany({
        where: { realizadoPorId: userId, estado: "borrador" },
        include: this.getDefaultInclude(),
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      dbLogger.error({ error, userId }, "Error finding borradores by user");
      throw error;
    }
  }
}

export const inspeccionRepository = new InspeccionRepository();
