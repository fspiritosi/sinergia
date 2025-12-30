-- AlterTable
ALTER TABLE "ClientLocations" ADD COLUMN     "ciudadId" TEXT,
ADD COLUMN     "provinciaId" TEXT;

-- AddForeignKey
ALTER TABLE "ClientLocations" ADD CONSTRAINT "ClientLocations_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientLocations" ADD CONSTRAINT "ClientLocations_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "Ciudad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
