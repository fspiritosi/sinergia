-- AlterTable
ALTER TABLE "InspeccionFormulario" ADD COLUMN     "editadoPorId" TEXT,
ADD COLUMN     "ultimaEdicionAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "InspeccionFormulario_editadoPorId_idx" ON "InspeccionFormulario"("editadoPorId");

-- AddForeignKey
ALTER TABLE "InspeccionFormulario" ADD CONSTRAINT "InspeccionFormulario_editadoPorId_fkey" FOREIGN KEY ("editadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

