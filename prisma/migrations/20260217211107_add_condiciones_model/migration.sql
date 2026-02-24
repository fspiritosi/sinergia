-- CreateEnum
CREATE TYPE "CondicionTipo" AS ENUM ('general', 'particular');

-- CreateTable
CREATE TABLE "Condicion" (
    "id" TEXT NOT NULL,
    "tipo" "CondicionTipo" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Condicion_tipo_idx" ON "Condicion"("tipo");

-- CreateIndex
CREATE INDEX "Condicion_is_active_idx" ON "Condicion"("is_active");

-- CreateIndex
CREATE INDEX "Condicion_category_idx" ON "Condicion"("category");

-- CreateIndex
CREATE INDEX "Condicion_order_idx" ON "Condicion"("order");
