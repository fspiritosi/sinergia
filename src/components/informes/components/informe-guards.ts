/**
 * Reglas de negocio para determinar si un Informe puede modificarse o eliminarse.
 *
 * Un informe se considera "ejecutado" cuando ya fue entregado (estado === "entregado").
 * En ese estado no se permite editarlo ni eliminarlo.
 */

export const INFORME_EJECUTADO_ERROR = "No se puede modificar o eliminar un informe ya entregado";

export function isInformeEjecutado(informe: { estado: string }): boolean {
  return informe.estado === "entregado";
}

export function assertInformeEditable(informe: { estado: string }): void {
  if (isInformeEjecutado(informe)) {
    throw new Error(INFORME_EJECUTADO_ERROR);
  }
}
