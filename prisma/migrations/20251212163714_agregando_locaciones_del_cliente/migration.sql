-- CreateTable
CREATE TABLE "ClientLocations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLocations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientLocations" ADD CONSTRAINT "ClientLocations_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
