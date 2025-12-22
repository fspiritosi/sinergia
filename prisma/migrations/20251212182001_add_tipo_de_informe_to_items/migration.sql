-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "tipoDeInformeId" TEXT;

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_tipoDeInformeId_fkey" FOREIGN KEY ("tipoDeInformeId") REFERENCES "TipoDeInforme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
