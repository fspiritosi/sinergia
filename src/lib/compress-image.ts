"use client";

import imageCompression from "browser-image-compression";

/**
 * Comprime/redimensiona una imagen en el navegador antes de subirla.
 *
 * Acepta originales grandes (fotos de celular de hasta ~50 MB) y las reduce a
 * un tamaño razonable para documentación (máx ~2560px de lado, ~1.5 MB),
 * respetando la orientación EXIF. Corre en un web worker para no bloquear la UI.
 *
 * Si el archivo no es una imagen o la compresión falla, devuelve el original.
 */
const DEFAULT_OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2560,
  useWebWorker: true,
  initialQuality: 0.8,
};

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const compressed = await imageCompression(file, DEFAULT_OPTIONS);
    // Garantizamos un File con nombre y tipo consistentes.
    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
