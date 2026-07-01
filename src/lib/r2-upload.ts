"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "./env";

const r2Client = new S3Client({
  region: "auto",
  endpoint: env.CLOUDFLARE_S3_API,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

/**
 * Sube un archivo a Cloudflare R2 bajo la key indicada.
 * La acción que llama a esta función decide qué guardar en la base (key o URL).
 */
export async function uploadFileToR2(file: File, key: string): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const body = new Uint8Array(arrayBuffer);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    })
  );
}

export async function deleteFileFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * Descarga los bytes de un objeto de R2 (bucket configurado por entorno).
 * Devuelve null si el objeto no existe o hubo error, para que el llamador
 * decida cómo manejarlo (ej: omitir la imagen en el PDF).
 */
export async function getBytesFromR2(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const result = await r2Client.send(
      new GetObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      })
    );

    if (!result.Body) return null;

    const bytes = await result.Body.transformToByteArray();
    return { bytes, contentType: result.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function uploadBytesToR2(
  body: Uint8Array,
  key: string,
  contentType: string
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}
