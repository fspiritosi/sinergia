/*
  Warnings:

  - A unique constraint covering the columns `[cuit]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cuit_key" ON "Cliente"("cuit");
