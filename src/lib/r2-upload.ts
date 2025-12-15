"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.CLOUDFLARE_S3_API
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.warn("Cloudflare R2 no está completamente configurado. Verificá las variables de entorno.")
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: R2_SECRET_ACCESS_KEY ?? "",
  },
})

/**
 * Sube un archivo a Cloudflare R2 bajo la key indicada.
 * La acción que llama a esta función decide qué guardar en la base (key o URL).
 */
export async function uploadFileToR2(file: File, key: string): Promise<void> {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error("Cloudflare R2 no está configurado")
  }

  const arrayBuffer = await file.arrayBuffer()
  const body = new Uint8Array(arrayBuffer)

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    }),
  )
}

export async function uploadBytesToR2(body: Uint8Array, key: string, contentType: string): Promise<void> {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error("Cloudflare R2 no está configurado")
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}
