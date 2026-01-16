-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "detail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hasVariant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variantTypeId" TEXT;

-- AlterTable
ALTER TABLE "PlanTrabajoProgramacion" ADD COLUMN     "detalleVarianteId" TEXT;

-- CreateTable
CREATE TABLE "TipoDeVariante" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoDeVariante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVariante" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variantTypeId" TEXT NOT NULL,

    CONSTRAINT "DetalleVariante_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "TipoDeVariante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajoProgramacion" ADD CONSTRAINT "PlanTrabajoProgramacion_detalleVarianteId_fkey" FOREIGN KEY ("detalleVarianteId") REFERENCES "DetalleVariante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVariante" ADD CONSTRAINT "DetalleVariante_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "TipoDeVariante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
