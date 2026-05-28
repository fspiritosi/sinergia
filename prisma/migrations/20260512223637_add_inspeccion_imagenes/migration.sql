-- CreateTable
CREATE TABLE "InspeccionRespuestaImagen" (
    "id" TEXT NOT NULL,
    "respuestaId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspeccionRespuestaImagen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspeccionRespuestaImagen_respuestaId_idx" ON "InspeccionRespuestaImagen"("respuestaId");

-- AddForeignKey
ALTER TABLE "InspeccionRespuestaImagen" ADD CONSTRAINT "InspeccionRespuestaImagen_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "InspeccionRespuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
