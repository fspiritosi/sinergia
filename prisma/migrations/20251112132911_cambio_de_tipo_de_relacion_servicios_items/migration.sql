/*
  Warnings:

  - You are about to drop the column `servicioId` on the `Items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Items" DROP CONSTRAINT "Items_servicioId_fkey";

-- AlterTable
ALTER TABLE "Items" DROP COLUMN "servicioId";

-- CreateTable
CREATE TABLE "ItemsOnServicios" (
    "servicioId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemsOnServicios_pkey" PRIMARY KEY ("servicioId","itemId")
);

-- AddForeignKey
ALTER TABLE "ItemsOnServicios" ADD CONSTRAINT "ItemsOnServicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsOnServicios" ADD CONSTRAINT "ItemsOnServicios_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
