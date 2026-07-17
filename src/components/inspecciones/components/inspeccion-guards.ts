/**
 * Reglas de negocio para determinar si una Inspección puede eliminarse.
 *
 * Una inspección se considera "finalizada" cuando su estado es "completada".
 * Las inspecciones en borrador puede eliminarlas cualquier usuario con permiso
 * de borrado. Las finalizadas solo puede eliminarlas un administrador.
 */

export const INSPECCION_FINALIZADA_ERROR =
  "Solo un administrador puede eliminar una inspección finalizada";

export function isInspeccionFinalizada(inspeccion: { estado: string }): boolean {
  return inspeccion.estado === "completada";
}

export function assertInspeccionEliminable(
  inspeccion: { estado: string },
  options?: { isAdmin?: boolean }
): void {
  if (isInspeccionFinalizada(inspeccion) && !options?.isAdmin) {
    throw new Error(INSPECCION_FINALIZADA_ERROR);
  }
}
