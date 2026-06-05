/**
 * Reglas de negocio para determinar si una Inspección puede eliminarse.
 *
 * Una inspección se considera "finalizada" cuando su estado es "completada".
 * No se permite eliminar inspecciones finalizadas (solo borradores).
 */

export const INSPECCION_FINALIZADA_ERROR = "No se puede eliminar una inspección finalizada";

export function isInspeccionFinalizada(inspeccion: { estado: string }): boolean {
  return inspeccion.estado === "completada";
}

export function assertInspeccionEliminable(inspeccion: { estado: string }): void {
  if (isInspeccionFinalizada(inspeccion)) {
    throw new Error(INSPECCION_FINALIZADA_ERROR);
  }
}
