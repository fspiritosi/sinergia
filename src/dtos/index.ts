/**
 * DTOs (Data Transfer Objects)
 *
 * Centralized export of all DTOs and transformation functions.
 * DTOs provide a clean separation between internal database entities
 * and external API responses.
 *
 * Usage:
 * ```typescript
 * import { toClienteDto, type ClienteDto } from "@/dtos"
 *
 * const cliente = await clienteRepository.findById(id)
 * const dto = toClienteDto(cliente)
 * return dto
 * ```
 */

// Cliente DTOs
export type {
  ClienteDto,
  ClienteWithLocationDto,
  ClienteDetailedDto,
  ClienteSummaryDto,
} from "./cliente.dto";

export {
  toClienteDto,
  toClienteWithLocationDto,
  toClienteDetailedDto,
  toClienteSummaryDto,
  toClienteDtos,
  toClienteWithLocationDtos,
  toClienteSummaryDtos,
} from "./cliente.dto";

// Propuesta DTOs
export type {
  PropuestaDto,
  PropuestaWithRelationsDto,
  PropuestaDetailedDto,
  PropuestaSummaryDto,
} from "./propuesta.dto";

export {
  toPropuestaDto,
  toPropuestaWithRelationsDto,
  toPropuestaDetailedDto,
  toPropuestaSummaryDto,
  toPropuestaDtos,
  toPropuestaWithRelationsDtos,
  toPropuestaSummaryDtos,
  formatValorConMoneda,
} from "./propuesta.dto";

// PlanTrabajo DTOs
export type {
  PlanTrabajoDto,
  PlanTrabajoWithRelationsDto,
  PlanTrabajoDetailedDto,
  PlanTrabajoProgramacionDto,
  PlanTrabajoSummaryDto,
} from "./planTrabajo.dto";

export {
  toPlanTrabajoDto,
  toPlanTrabajoWithRelationsDto,
  toPlanTrabajoDetailedDto,
  toPlanTrabajoProgramacionDto,
  toPlanTrabajoSummaryDto,
  toPlanTrabajoDtos,
  toPlanTrabajoWithRelationsDtos,
  toPlanTrabajoSummaryDtos,
  getEstadoDisplay,
} from "./planTrabajo.dto";
