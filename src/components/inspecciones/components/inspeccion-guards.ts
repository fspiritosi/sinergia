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

/**
 * Reglas de negocio para determinar si una Inspección puede editarse.
 *
 * Las inspecciones en borrador las edita cualquier usuario con permiso de
 * actualización. Las finalizadas solo puede editarlas quien además tenga el
 * permiso `inspecciones:edit-finalizada`.
 */

export const INSPECCION_NO_EDITABLE_ERROR =
  "La inspección está finalizada: se necesita el permiso de edición de inspecciones finalizadas";

export function isInspeccionEditable(
  inspeccion: { estado: string },
  options?: { canEditFinalizada?: boolean }
): boolean {
  return !isInspeccionFinalizada(inspeccion) || options?.canEditFinalizada === true;
}

export function assertInspeccionEditable(
  inspeccion: { estado: string },
  options?: { canEditFinalizada?: boolean }
): void {
  if (!isInspeccionEditable(inspeccion, options)) {
    throw new Error(INSPECCION_NO_EDITABLE_ERROR);
  }
}
