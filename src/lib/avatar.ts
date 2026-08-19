/**
 * URL con la que el navegador pide la foto de perfil de un usuario.
 *
 * `User.image` guarda la **key** de R2, no una URL: el bucket no es público
 * (sólo lo son los logos), así que la imagen se sirve por una API route.
 *
 * La key viaja como query string para romper la caché del navegador. Sin eso,
 * el usuario sube una foto nueva y sigue viendo la anterior, porque la
 * respuesta de esa misma URL ya está cacheada.
 */
export function avatarUrl(userId: string, imageKey: string | null | undefined): string | null {
  if (!imageKey) return null;
  return `/api/usuarios/avatar/${userId}?v=${encodeURIComponent(imageKey)}`;
}

/** Iniciales para el fallback del avatar: hasta dos, del nombre o del email. */
export function iniciales(name: string | null | undefined, email: string): string {
  const delNombre = name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("");

  return (delNombre || email[0] || "?").toUpperCase();
}
