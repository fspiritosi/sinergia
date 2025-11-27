-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('mensual', 'unitario');

-- AlterTable
ALTER TABLE "Servicio" ADD COLUMN     "type" "ServiceType" NOT NULL DEFAULT 'mensual';
