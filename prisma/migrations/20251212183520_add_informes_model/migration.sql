-- CreateEnum
CREATE TYPE "InformeEstado" AS ENUM ('pendiente', 'entregado');

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoDeInformeId" TEXT NOT NULL,
    "propuestaId" TEXT NOT NULL,
    "clientLocationId" TEXT NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "responsableConfeccion" TEXT NOT NULL,
    "estado" "InformeEstado" NOT NULL DEFAULT 'pendiente',
    "adjunto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Informe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_tipoDeInformeId_fkey" FOREIGN KEY ("tipoDeInformeId") REFERENCES "TipoDeInforme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "PropuestaTecnica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_clientLocationId_fkey" FOREIGN KEY ("clientLocationId") REFERENCES "ClientLocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
