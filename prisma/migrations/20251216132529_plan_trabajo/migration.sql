/*
  Warnings:

  - A unique constraint covering the columns `[planTrabajoProgramacionId]` on the table `Informe` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlanTrabajoEstado" AS ENUM ('pendiente_programacion', 'programado_incompleto', 'programado_completo', 'en_desarrollo', 'finalizado_con_pendientes', 'finalizado_completo');

-- CreateEnum
CREATE TYPE "ProgramacionPrecision" AS ENUM ('mes', 'dia');

-- AlterTable
ALTER TABLE "Informe" ADD COLUMN     "planTrabajoProgramacionId" TEXT;

-- CreateTable
CREATE TABLE "PlanTrabajo" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "propuestaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "PlanTrabajoEstado" NOT NULL DEFAULT 'pendiente_programacion',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanTrabajoProgramacion" (
    "id" TEXT NOT NULL,
    "planTrabajoId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "precision" "ProgramacionPrecision" NOT NULL DEFAULT 'dia',
    "clientLocationId" TEXT,
    "ejecutadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanTrabajoProgramacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Informe_planTrabajoProgramacionId_key" ON "Informe"("planTrabajoProgramacionId");

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_planTrabajoProgramacionId_fkey" FOREIGN KEY ("planTrabajoProgramacionId") REFERENCES "PlanTrabajoProgramacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajo" ADD CONSTRAINT "PlanTrabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajo" ADD CONSTRAINT "PlanTrabajo_propuestaId_fkey" FOREIGN KEY ("propuestaId") REFERENCES "PropuestaTecnica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajoProgramacion" ADD CONSTRAINT "PlanTrabajoProgramacion_planTrabajoId_fkey" FOREIGN KEY ("planTrabajoId") REFERENCES "PlanTrabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajoProgramacion" ADD CONSTRAINT "PlanTrabajoProgramacion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanTrabajoProgramacion" ADD CONSTRAINT "PlanTrabajoProgramacion_clientLocationId_fkey" FOREIGN KEY ("clientLocationId") REFERENCES "ClientLocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
