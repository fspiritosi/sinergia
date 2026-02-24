import type {
  PropuestaTecnica,
  Cliente,
  Servicio,
  PropuestaStatus,
  Moneda,
} from "@/generated/client";

/**
 * Basic Propuesta DTO
 * Contains essential propuesta information without relations
 */
export interface PropuestaDto {
  id: string;
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia: string | null;
  status: PropuestaStatus;
  items: string[];
  valor: string; // Decimal as string for precision
  moneda: Moneda;
  contacto: string | null;
  is_active: boolean;
  condicionesParticulares: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Propuesta DTO with basic cliente and servicio information
 */
export interface PropuestaWithRelationsDto extends PropuestaDto {
  cliente: {
    id: string;
    name: string;
    cuit: string;
  };
  servicio: {
    id: string;
    nombre: string;
    tipo: string;
  };
}

/**
 * Detailed Propuesta DTO
 * Includes full relations and counts
 */
export interface PropuestaDetailedDto extends PropuestaWithRelationsDto {
  informesCount?: number;
  planesTrabajoCount?: number;
  hasActivePlanTrabajo?: boolean;
}

/**
 * Propuesta summary DTO for lists and selections
 */
export interface PropuestaSummaryDto {
  id: string;
  codigo: string;
  clienteNombre: string;
  servicioNombre: string;
  status: PropuestaStatus;
  valor: string;
  moneda: Moneda;
}

/**
 * Transform PropuestaTecnica entity to basic DTO
 */
export function toPropuestaDto(propuesta: PropuestaTecnica): PropuestaDto {
  return {
    id: propuesta.id,
    codigo: propuesta.codigo,
    clienteId: propuesta.clienteId,
    servicioId: propuesta.servicioId,
    vigencia: propuesta.vigencia?.toISOString() || null,
    status: propuesta.status,
    items: propuesta.items || [],
    valor: propuesta.valor.toString(),
    moneda: propuesta.moneda,
    contacto: propuesta.contacto || null,
    is_active: propuesta.is_active,
    condicionesParticulares: propuesta.condicionesParticulares || [],
    createdAt: propuesta.createdAt.toISOString(),
    updatedAt: propuesta.updatedAt.toISOString(),
  };
}

/**
 * Transform PropuestaTecnica with relations to DTO
 */
export function toPropuestaWithRelationsDto(
  propuesta: PropuestaTecnica & {
    cliente?: Cliente;
    servicios?: Servicio;
  }
): PropuestaWithRelationsDto {
  return {
    ...toPropuestaDto(propuesta),
    cliente: propuesta.cliente
      ? {
          id: propuesta.cliente.id,
          name: propuesta.cliente.name,
          cuit: propuesta.cliente.cuit,
        }
      : {
          id: propuesta.clienteId,
          name: "Cliente no disponible",
          cuit: "",
        },
    servicio: propuesta.servicios
      ? {
          id: propuesta.servicios.id,
          nombre: propuesta.servicios.name,
          tipo: propuesta.servicios.type,
        }
      : {
          id: propuesta.servicioId,
          nombre: "Servicio no disponible",
          tipo: "",
        },
  };
}

/**
 * Transform PropuestaTecnica with all relations to detailed DTO
 */
export function toPropuestaDetailedDto(
  propuesta: PropuestaTecnica & {
    cliente?: Cliente;
    servicios?: Servicio;
    informes?: any[];
    planesTrabajo?: any[];
  }
): PropuestaDetailedDto {
  return {
    ...toPropuestaWithRelationsDto(propuesta),
    informesCount: propuesta.informes?.length,
    planesTrabajoCount: propuesta.planesTrabajo?.length,
    hasActivePlanTrabajo: propuesta.planesTrabajo?.some(
      (plan: any) => plan.estado !== "finalizado_completo"
    ),
  };
}

/**
 * Transform PropuestaTecnica to summary DTO
 */
export function toPropuestaSummaryDto(
  propuesta: PropuestaTecnica & {
    cliente?: Cliente;
    servicios?: Servicio;
  }
): PropuestaSummaryDto {
  return {
    id: propuesta.id,
    codigo: propuesta.codigo,
    clienteNombre: propuesta.cliente?.name || "N/A",
    servicioNombre: propuesta.servicios?.name || "N/A",
    status: propuesta.status,
    valor: propuesta.valor.toString(),
    moneda: propuesta.moneda,
  };
}

/**
 * Transform array of Propuestas to DTOs
 */
export function toPropuestaDtos(propuestas: PropuestaTecnica[]): PropuestaDto[] {
  return propuestas.map(toPropuestaDto);
}

export function toPropuestaWithRelationsDtos(
  propuestas: (PropuestaTecnica & {
    cliente?: Cliente;
    servicios?: Servicio;
  })[]
): PropuestaWithRelationsDto[] {
  return propuestas.map(toPropuestaWithRelationsDto);
}

export function toPropuestaSummaryDtos(
  propuestas: (PropuestaTecnica & {
    cliente?: Cliente;
    servicios?: Servicio;
  })[]
): PropuestaSummaryDto[] {
  return propuestas.map(toPropuestaSummaryDto);
}

/**
 * Helper to format valor with currency symbol
 */
export function formatValorConMoneda(valor: string, moneda: Moneda): string {
  const symbols: Record<Moneda, string> = {
    ARS: "$",
    USD: "US$",
    EUR: "€",
  };

  const numericValue = parseFloat(valor);
  const formattedValue = numericValue.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbols[moneda]} ${formattedValue}`;
}
