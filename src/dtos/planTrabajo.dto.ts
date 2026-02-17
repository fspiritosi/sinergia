import type {
  PlanTrabajo,
  PlanTrabajoProgramacion,
  PlanTrabajoEstado,
  ProgramacionPrecision,
  Cliente,
  PropuestaTecnica,
  Items,
  ClientLocations,
  Informe,
} from "@/generated/client";

/**
 * Basic PlanTrabajo DTO
 * Contains essential plan information without relations
 */
export interface PlanTrabajoDto {
  id: string;
  clienteId: string;
  propuestaId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: PlanTrabajoEstado;
  createdAt: string;
  updatedAt: string;
}

/**
 * PlanTrabajo DTO with basic relations
 */
export interface PlanTrabajoWithRelationsDto extends PlanTrabajoDto {
  cliente: {
    id: string;
    name: string;
    cuit: string;
  };
  propuesta: {
    id: string;
    codigo: string;
    servicioNombre?: string;
  };
  programacionesCount: number;
  programacionesCompletadas: number;
  porcentajeCompletado: number;
}

/**
 * Detailed PlanTrabajo DTO
 * Includes all programaciones and full relations
 */
export interface PlanTrabajoDetailedDto extends PlanTrabajoWithRelationsDto {
  programaciones: PlanTrabajoProgramacionDto[];
}

/**
 * PlanTrabajoProgramacion DTO
 */
export interface PlanTrabajoProgramacionDto {
  id: string;
  planTrabajoId: string;
  itemId: string;
  itemNombre: string;
  fechaProgramada: string;
  precision: ProgramacionPrecision;
  clientLocationId: string | null;
  clientLocationNombre: string | null;
  ejecutadoAt: string | null;
  adjunto: string | null;
  informeId: string | null;
  detalleVarianteId: string | null;
  isCompletado: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * PlanTrabajo summary DTO for lists and calendar views
 */
export interface PlanTrabajoSummaryDto {
  id: string;
  clienteNombre: string;
  propuestaCodigo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: PlanTrabajoEstado;
  porcentajeCompletado: number;
}

/**
 * Transform PlanTrabajo entity to basic DTO
 */
export function toPlanTrabajoDto(plan: PlanTrabajo): PlanTrabajoDto {
  return {
    id: plan.id,
    clienteId: plan.clienteId,
    propuestaId: plan.propuestaId,
    fechaInicio: plan.fechaInicio.toISOString(),
    fechaFin: plan.fechaFin.toISOString(),
    estado: plan.estado,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

/**
 * Transform PlanTrabajo with relations to DTO
 */
export function toPlanTrabajoWithRelationsDto(
  plan: PlanTrabajo & {
    cliente?: Cliente;
    propuesta?: PropuestaTecnica & {
      servicios?: { nombre: string };
    };
    programaciones?: PlanTrabajoProgramacion[];
  }
): PlanTrabajoWithRelationsDto {
  const programacionesCount = plan.programaciones?.length || 0;
  const programacionesCompletadas =
    plan.programaciones?.filter((p) => p.ejecutadoAt !== null).length || 0;
  const porcentajeCompletado =
    programacionesCount > 0
      ? Math.round((programacionesCompletadas / programacionesCount) * 100)
      : 0;

  return {
    ...toPlanTrabajoDto(plan),
    cliente: plan.cliente
      ? {
          id: plan.cliente.id,
          name: plan.cliente.name,
          cuit: plan.cliente.cuit,
        }
      : {
          id: plan.clienteId,
          name: "Cliente no disponible",
          cuit: "",
        },
    propuesta: plan.propuesta
      ? {
          id: plan.propuesta.id,
          codigo: plan.propuesta.codigo,
          servicioNombre: plan.propuesta.servicios?.nombre,
        }
      : {
          id: plan.propuestaId,
          codigo: "N/A",
        },
    programacionesCount,
    programacionesCompletadas,
    porcentajeCompletado,
  };
}

/**
 * Transform PlanTrabajo with all relations to detailed DTO
 */
export function toPlanTrabajoDetailedDto(
  plan: PlanTrabajo & {
    cliente?: Cliente;
    propuesta?: PropuestaTecnica & {
      servicios?: { nombre: string };
    };
    programaciones?: (PlanTrabajoProgramacion & {
      item?: Items;
      clientLocation?: ClientLocations;
      informe?: Informe;
    })[];
  }
): PlanTrabajoDetailedDto {
  return {
    ...toPlanTrabajoWithRelationsDto(plan),
    programaciones: plan.programaciones?.map((prog) => toPlanTrabajoProgramacionDto(prog)) || [],
  };
}

/**
 * Transform PlanTrabajoProgramacion to DTO
 */
export function toPlanTrabajoProgramacionDto(
  programacion: PlanTrabajoProgramacion & {
    item?: Items;
    clientLocation?: ClientLocations;
    informe?: Informe;
  }
): PlanTrabajoProgramacionDto {
  return {
    id: programacion.id,
    planTrabajoId: programacion.planTrabajoId,
    itemId: programacion.itemId,
    itemNombre: programacion.item?.nombre || "Item no disponible",
    fechaProgramada: programacion.fechaProgramada.toISOString(),
    precision: programacion.precision,
    clientLocationId: programacion.clientLocationId,
    clientLocationNombre: programacion.clientLocation?.nombre || null,
    ejecutadoAt: programacion.ejecutadoAt?.toISOString() || null,
    adjunto: programacion.adjunto,
    informeId: programacion.informe?.id || null,
    detalleVarianteId: programacion.detalleVarianteId,
    isCompletado: programacion.ejecutadoAt !== null,
    createdAt: programacion.createdAt.toISOString(),
    updatedAt: programacion.updatedAt.toISOString(),
  };
}

/**
 * Transform PlanTrabajo to summary DTO
 */
export function toPlanTrabajoSummaryDto(
  plan: PlanTrabajo & {
    cliente?: Cliente;
    propuesta?: PropuestaTecnica;
    programaciones?: PlanTrabajoProgramacion[];
  }
): PlanTrabajoSummaryDto {
  const programacionesCount = plan.programaciones?.length || 0;
  const programacionesCompletadas =
    plan.programaciones?.filter((p) => p.ejecutadoAt !== null).length || 0;
  const porcentajeCompletado =
    programacionesCount > 0
      ? Math.round((programacionesCompletadas / programacionesCount) * 100)
      : 0;

  return {
    id: plan.id,
    clienteNombre: plan.cliente?.name || "N/A",
    propuestaCodigo: plan.propuesta?.codigo || "N/A",
    fechaInicio: plan.fechaInicio.toISOString(),
    fechaFin: plan.fechaFin.toISOString(),
    estado: plan.estado,
    porcentajeCompletado,
  };
}

/**
 * Transform array of PlanTrabajo to DTOs
 */
export function toPlanTrabajoDtos(planes: PlanTrabajo[]): PlanTrabajoDto[] {
  return planes.map(toPlanTrabajoDto);
}

export function toPlanTrabajoWithRelationsDtos(
  planes: (PlanTrabajo & {
    cliente?: Cliente;
    propuesta?: PropuestaTecnica & {
      servicios?: { nombre: string };
    };
    programaciones?: PlanTrabajoProgramacion[];
  })[]
): PlanTrabajoWithRelationsDto[] {
  return planes.map(toPlanTrabajoWithRelationsDto);
}

export function toPlanTrabajoSummaryDtos(
  planes: (PlanTrabajo & {
    cliente?: Cliente;
    propuesta?: PropuestaTecnica;
    programaciones?: PlanTrabajoProgramacion[];
  })[]
): PlanTrabajoSummaryDto[] {
  return planes.map(toPlanTrabajoSummaryDto);
}

/**
 * Helper to get estado display text with color
 */
export function getEstadoDisplay(estado: PlanTrabajoEstado): {
  text: string;
  color: string;
} {
  const displays: Record<PlanTrabajoEstado, { text: string; color: string }> = {
    pendiente_programacion: { text: "Pendiente Programación", color: "gray" },
    programado_incompleto: { text: "Programado Incompleto", color: "yellow" },
    programado_completo: { text: "Programado Completo", color: "blue" },
    en_desarrollo: { text: "En Desarrollo", color: "orange" },
    finalizado_con_pendientes: {
      text: "Finalizado con Pendientes",
      color: "amber",
    },
    finalizado_completo: { text: "Finalizado Completo", color: "green" },
  };

  return displays[estado];
}
