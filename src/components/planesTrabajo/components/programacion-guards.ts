/**
 * Reglas de negocio para determinar si una PlanTrabajoProgramacion puede
 * modificarse o eliminarse.
 *
 * Una programación se considera "ejecutada" cuando:
 *  - tiene `ejecutadoAt` (marca de ejecución manual), o
 *  - su informe asociado fue entregado y tiene adjunto cargado.
 *
 * En ese estado no se permite editarla ni eliminarla.
 */

export const PROGRAMACION_EJECUTADA_ERROR =
  "No se puede modificar o eliminar una programación ya ejecutada";

type ProgramacionEstado = {
  ejecutadoAt: Date | null;
  informe?: { estado: string; adjunto: string | null } | null;
};

export function isProgramacionEjecutada(prog: ProgramacionEstado): boolean {
  if (prog.ejecutadoAt) return true;

  const informe = prog.informe;
  return Boolean(informe && informe.estado === "entregado" && informe.adjunto);
}

export function assertProgramacionEditable(prog: ProgramacionEstado): void {
  if (isProgramacionEjecutada(prog)) {
    throw new Error(PROGRAMACION_EJECUTADA_ERROR);
  }
}
