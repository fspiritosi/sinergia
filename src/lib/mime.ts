/**
 * Infiere el content-type de imagen a partir de la extensión de una key de R2.
 * Se usa como fallback cuando R2 no devuelve un ContentType confiable.
 */
const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function contentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_CONTENT_TYPE[ext] ?? "application/octet-stream";
}
