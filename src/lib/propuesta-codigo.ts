/**
 * Numeración de códigos de propuesta con formato "AÑO-NNN".
 *
 * La numeración arranca en 101 para la primera propuesta del año en curso e
 * incrementa de a 1. Al cambiar de año, el contador se reinicia (la primera
 * del nuevo año vuelve a ser 101). Ej: 2026-101, 2026-102, ..., 2027-101.
 *
 * Las propuestas con códigos en formato libre/antiguo se ignoran al calcular
 * el siguiente número.
 */

export const PRIMER_NUMERO_PROPUESTA = 101;

/**
 * Extrae el número NNN de un código si coincide exactamente con `${year}-NNN`.
 * Devuelve null si no coincide (otro año, formato libre, etc.).
 */
export function parseCodigoNumero(codigo: string, year: number): number | null {
  const match = codigo.match(new RegExp(`^${year}-(\\d+)$`));
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * Calcula el siguiente número de propuesta para el año dado a partir de los
 * códigos existentes. Devuelve max+1 entre los códigos del año, o 101 si no
 * hay ninguno.
 */
export function nextCodigoNumero(existingCodigos: string[], year: number): number {
  let max = PRIMER_NUMERO_PROPUESTA - 1;
  for (const codigo of existingCodigos) {
    const numero = parseCodigoNumero(codigo, year);
    if (numero !== null && numero > max) {
      max = numero;
    }
  }
  return max + 1;
}

export function formatCodigoPropuesta(year: number, numero: number): string {
  return `${year}-${numero}`;
}
