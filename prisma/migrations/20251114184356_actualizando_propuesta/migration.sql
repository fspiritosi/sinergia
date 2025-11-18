-- CreateEnum
CREATE TYPE "PropuestaStatus" AS ENUM ('pendiente', 'aprobada', 'rechazada', 'en_progreso', 'finalizada');

-- AlterTable
ALTER TABLE "PropuestaTecnica" ADD COLUMN     "status" "PropuestaStatus" NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "vigencia" TIMESTAMP(3);
