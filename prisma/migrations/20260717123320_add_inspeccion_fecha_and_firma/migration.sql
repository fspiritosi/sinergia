-- AlterTable
ALTER TABLE "InspeccionFormulario" ADD COLUMN     "fechaInspeccion" TIMESTAMP(3),
ADD COLUMN     "firmaR2Key" TEXT;

-- CreateIndex
CREATE INDEX "InspeccionFormulario_fechaInspeccion_idx" ON "InspeccionFormulario"("fechaInspeccion");
