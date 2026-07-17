import prisma from "@/lib/db";
import { getBytesFromR2 } from "@/lib/r2-upload";
import { apiLogger } from "@/lib/logger";

// [id] es el id del formulario de inspección. Servimos su firma desde R2.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const inspeccion = await prisma.inspeccionFormulario.findUnique({
    where: { id },
    select: { firmaR2Key: true },
  });

  if (!inspeccion?.firmaR2Key) {
    return new Response("Firma no encontrada", { status: 404 });
  }

  try {
    const file = await getBytesFromR2(inspeccion.firmaR2Key);
    if (!file) {
      return new Response("Archivo no encontrado", { status: 404 });
    }

    const contentType =
      file.contentType && file.contentType !== "application/octet-stream"
        ? file.contentType
        : "image/png";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", "inline");
    // Sin cache: la firma puede reemplazarse y debe reflejarse de inmediato.
    headers.set("Cache-Control", "no-store");

    return new Response(Buffer.from(file.bytes), { headers });
  } catch (error) {
    apiLogger.error(
      { error, formularioId: id, key: inspeccion.firmaR2Key },
      "Error al obtener firma de R2"
    );
    return new Response("Error al obtener el archivo", { status: 500 });
  }
}
