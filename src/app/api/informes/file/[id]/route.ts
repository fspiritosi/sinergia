import prisma from "@/lib/db"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { env } from "@/lib/env"
import { apiLogger } from "@/lib/logger"

const r2Client = new S3Client({
  region: "auto",
  endpoint: env.CLOUDFLARE_S3_API,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const informe = await prisma.informe.findUnique({
    where: { id },
  })

  if (!informe) {
    return new Response("Informe no encontrado", { status: 404 })
  }

  const key = informe.adjunto || `informes/${informe.id}`

  try {
    const result = await r2Client.send(
      new GetObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      }),
    )

    const body = result.Body
    if (!body) {
      return new Response("Archivo no encontrado", { status: 404 })
    }

    const stream = body as ReadableStream<Uint8Array>

    const headers = new Headers()
    if (result.ContentType) {
      headers.set("Content-Type", result.ContentType)
    }
    headers.set("Content-Disposition", "inline")

    return new Response(stream, { headers })
  } catch (error) {
    apiLogger.error({ error, informeId: id, key }, "Error al obtener archivo de R2")
    return new Response("Error al obtener el archivo", { status: 500 })
  }
}
