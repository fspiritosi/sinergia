-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "ciudadId" TEXT,
ADD COLUMN     "provinciaId" TEXT;

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ciudad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,

    CONSTRAINT "Ciudad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_ciudadId_fkey" FOREIGN KEY ("ciudadId") REFERENCES "Ciudad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudad" ADD CONSTRAINT "Ciudad_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
