import { headers } from "next/headers";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { getBytesFromR2 } from "@/lib/r2-upload";
import { contentTypeFromKey } from "@/lib/mime";
import { apiLogger } from "@/lib/logger";

/**
 * Sirve la foto de perfil de un usuario desde R2.
 *
 * `[id]` es el `User.id`. La foto de cualquier usuario es visible para quien
 * tenga sesión (aparece en el sidebar y, más adelante, en listados), pero no
 * para anónimos: el bucket no es público y esta ruta es el único acceso.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("No autorizado", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { image: true },
  });

  if (!user?.image) {
    return new Response("El usuario no tiene foto", { status: 404 });
  }

  try {
    const file = await getBytesFromR2(user.image);
    if (!file) {
      return new Response("Archivo no encontrado", { status: 404 });
    }

    const contentType =
      file.contentType && file.contentType !== "application/octet-stream"
        ? file.contentType
        : contentTypeFromKey(user.image);

    const headersRespuesta = new Headers();
    headersRespuesta.set("Content-Type", contentType);
    headersRespuesta.set("Content-Disposition", "inline");
    // `immutable` es seguro porque cada subida genera una key nueva: la URL
    // cambia con la foto, así que una respuesta cacheada nunca queda vieja.
    headersRespuesta.set("Cache-Control", "private, max-age=86400, immutable");

    return new Response(Buffer.from(file.bytes), { headers: headersRespuesta });
  } catch (error) {
    apiLogger.error({ error, userId: id, key: user.image }, "Error al obtener el avatar de R2");
    return new Response("Error al obtener el archivo", { status: 500 });
  }
}
