import { z } from "zod";

/**
 * Validaciones de "Mi cuenta": lo que un usuario puede cambiar de sí mismo.
 *
 * Vive acá y no dentro del diálogo porque las mismas reglas se aplican en el
 * cliente (para mostrar el error debajo del campo) y en el servidor (que es
 * donde realmente se hacen valer).
 */

export const cambiarPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z.string().min(8, "La contraseña nueva tiene que tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Repetí la contraseña nueva"),
  })
  // El orden importa: si la nueva es corta, ese error se muestra primero y no
  // el de "no coinciden", que confundiría.
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "La contraseña nueva tiene que ser distinta de la actual",
    path: ["newPassword"],
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;

export const perfilSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre tiene que tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
});

export type PerfilInput = z.infer<typeof perfilSchema>;

/** Formatos que aceptamos para la foto de perfil. */
export const AVATAR_TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Tope del archivo original, antes de comprimir. Es holgado a propósito: una
 * foto de celular sin recortar entra sin problemas y después se reduce en el
 * navegador.
 */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Lado máximo de la imagen ya comprimida. Un avatar no necesita más. */
export const AVATAR_MAX_LADO = 512;

/**
 * Devuelve el motivo del rechazo, o `null` si el archivo sirve.
 *
 * Toma sólo `type` y `size` en vez de un `File` para poder usarse igual en el
 * servidor, donde llega un `File` del FormData, y en los tests.
 */
export function validarArchivoAvatar(file: { type: string; size: number }): string | null {
  if (!(AVATAR_TIPOS_PERMITIDOS as readonly string[]).includes(file.type)) {
    return "La foto tiene que ser JPG, PNG o WEBP";
  }
  if (file.size === 0) {
    return "El archivo está vacío";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return `La foto no puede superar los ${AVATAR_MAX_BYTES / 1024 / 1024} MB`;
  }
  return null;
}
