import type { Cliente, Provincia, Ciudad, ClientLocations } from "@/generated/client";

/**
 * Basic Cliente DTO
 * Contains essential cliente information without relations
 */
export interface ClienteDto {
  id: string;
  name: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  domicilio: string | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cliente DTO with geographic information
 */
export interface ClienteWithLocationDto extends ClienteDto {
  provincia: {
    id: string;
    nombre: string;
  } | null;
  ciudad: {
    id: string;
    nombre: string;
  } | null;
}

/**
 * Detailed Cliente DTO
 * Includes all relations and additional locations
 */
export interface ClienteDetailedDto extends ClienteWithLocationDto {
  clientLocations: {
    id: string;
    nombre: string;
    domicilio: string;
    provincia: {
      id: string;
      nombre: string;
    } | null;
    ciudad: {
      id: string;
      nombre: string;
    } | null;
  }[];
  propuestasCount?: number;
  informesCount?: number;
}

/**
 * Cliente summary DTO for lists and selections
 */
export interface ClienteSummaryDto {
  id: string;
  name: string;
  cuit: string;
  is_active: boolean;
}

/**
 * Transform Cliente entity to basic DTO
 */
export function toClienteDto(cliente: Cliente): ClienteDto {
  return {
    id: cliente.id,
    name: cliente.name,
    cuit: cliente.cuit,
    email: cliente.email || null,
    telefono: cliente.telefono || null,
    domicilio: cliente.domicilio || null,
    is_active: cliente.is_active,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
  };
}

/**
 * Transform Cliente with relations to DTO with location
 */
export function toClienteWithLocationDto(
  cliente: Cliente & {
    provincia?: Provincia | null;
    ciudad?: Ciudad | null;
  }
): ClienteWithLocationDto {
  return {
    ...toClienteDto(cliente),
    provincia: cliente.provincia
      ? {
          id: cliente.provincia.id,
          nombre: cliente.provincia.nombre,
        }
      : null,
    ciudad: cliente.ciudad
      ? {
          id: cliente.ciudad.id,
          nombre: cliente.ciudad.nombre,
        }
      : null,
  };
}

/**
 * Transform Cliente with all relations to detailed DTO
 */
export function toClienteDetailedDto(
  cliente: Cliente & {
    provincia?: Provincia | null;
    ciudad?: Ciudad | null;
    clientLocations?: (ClientLocations & {
      provincia?: Provincia | null;
      ciudad?: Ciudad | null;
    })[];
    propuestas?: any[];
    informes?: any[];
  }
): ClienteDetailedDto {
  return {
    ...toClienteWithLocationDto(cliente),
    clientLocations:
      cliente.clientLocations?.map((location) => ({
        id: location.id,
        nombre: location.nombre,
        domicilio: location.domicilio,
        provincia: location.provincia
          ? {
              id: location.provincia.id,
              nombre: location.provincia.nombre,
            }
          : null,
        ciudad: location.ciudad
          ? {
              id: location.ciudad.id,
              nombre: location.ciudad.nombre,
            }
          : null,
      })) || [],
    propuestasCount: cliente.propuestas?.length,
    informesCount: cliente.informes?.length,
  };
}

/**
 * Transform Cliente to summary DTO
 */
export function toClienteSummaryDto(cliente: Cliente): ClienteSummaryDto {
  return {
    id: cliente.id,
    name: cliente.name,
    cuit: cliente.cuit,
    is_active: cliente.is_active,
  };
}

/**
 * Transform array of Clientes to DTOs
 */
export function toClienteDtos(clientes: Cliente[]): ClienteDto[] {
  return clientes.map(toClienteDto);
}

export function toClienteWithLocationDtos(
  clientes: (Cliente & {
    provincia?: Provincia | null;
    ciudad?: Ciudad | null;
  })[]
): ClienteWithLocationDto[] {
  return clientes.map(toClienteWithLocationDto);
}

export function toClienteSummaryDtos(clientes: Cliente[]): ClienteSummaryDto[] {
  return clientes.map(toClienteSummaryDto);
}
