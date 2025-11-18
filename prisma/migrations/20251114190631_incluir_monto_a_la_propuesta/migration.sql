-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('ARS', 'USD', 'EUR');

-- AlterTable
ALTER TABLE "PropuestaTecnica" ADD COLUMN     "moneda" "Moneda" NOT NULL DEFAULT 'ARS',
ADD COLUMN     "valor" DECIMAL(65,30) NOT NULL DEFAULT 0;
