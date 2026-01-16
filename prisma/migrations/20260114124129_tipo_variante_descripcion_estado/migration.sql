-- AlterTable
ALTER TABLE "TipoDeVariante" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
