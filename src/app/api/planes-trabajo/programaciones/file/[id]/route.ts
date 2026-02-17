"use server";

import prisma from "@/lib/db";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { apiLogger } from "@/lib/logger";

const r2Client = new S3Client({
  region: "auto",
  endpoint: env.CLOUDFLARE_S3_API,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const programacion = await prisma.planTrabajoProgramacion.findUnique({
    where: { id },
    select: { adjunto: true },
  });

  if (!programacion) {
    return new Response("Programación no encontrada", { status: 404 });
  }

  const key = programacion.adjunto || `programaciones/${id}`;

  try {
    const result = await r2Client.send(
      new GetObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      })
    );

    const body = result.Body;
    if (!body) {
      return new Response("Archivo no encontrado", { status: 404 });
    }

    const stream = body as ReadableStream<Uint8Array>;

    const headers = new Headers();
    if (result.ContentType) headers.set("Content-Type", result.ContentType);
    headers.set("Content-Disposition", "inline");

    return new Response(stream, { headers });
  } catch (error) {
    apiLogger.error({ error, programacionId: id, key }, "Error al obtener archivo de R2");
    return new Response("Error al obtener el archivo", { status: 500 });
  }
}
