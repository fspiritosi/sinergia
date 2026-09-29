/**
 * Helpers para eliminar registros de configuración que pueden estar en uso.
 *
 * Las actions de borrado devuelven un `DeleteResult` en lugar de lanzar: en
 * producción Next.js no deja llegar al cliente el mensaje de un error lanzado
 * por una server action, y el usuario necesita saber por qué no se borró.
 */

export type DeleteResult = { success: true } | { success: false; error: string };

export type Uso = { cantidad: number; singular: string; plural: string };

/**
 * Arma el mensaje de "no se puede eliminar" a partir de los registros que
 * referencian a la entidad. Devuelve null si ninguno la usa.
 */
export function mensajeEnUso(entidad: string, usos: Uso[]): string | null {
  const partes = usos
    .filter((u) => u.cantidad > 0)
    .map((u) => `${u.cantidad} ${u.cantidad === 1 ? u.singular : u.plural}`);
  if (partes.length === 0) return null;

  const lista =
    partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
  return `No se puede eliminar ${entidad}: está en uso en ${lista}. Podés desactivarlo desde Editar.`;
}

/** Violación de clave foránea de Prisma: otro registro se creó entre el chequeo y el borrado. */
export function esErrorDeReferencia(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2003"
  );
}
