import prisma from "@/lib/db";
import { getBytesFromR2 } from "@/lib/r2-upload";
import { contentTypeFromKey } from "@/lib/mime";
import { apiLogger } from "@/lib/logger";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const imagen = await prisma.inspeccionRespuestaImagen.findUnique({
    where: { id },
    select: { r2Key: true },
  });

  if (!imagen) {
    return new Response("Imagen no encontrada", { status: 404 });
  }

  try {
    const file = await getBytesFromR2(imagen.r2Key);
    if (!file) {
      return new Response("Archivo no encontrado", { status: 404 });
    }

    const contentType =
      file.contentType && file.contentType !== "application/octet-stream"
        ? file.contentType
        : contentTypeFromKey(imagen.r2Key);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", "inline");
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(Buffer.from(file.bytes), { headers });
  } catch (error) {
    apiLogger.error({ error, imagenId: id, key: imagen.r2Key }, "Error al obtener imagen de R2");
    return new Response("Error al obtener el archivo", { status: 500 });
  }
}
