-- CreateEnum
CREATE TYPE "InspeccionEstado" AS ENUM ('borrador', 'completada');

-- CreateEnum
CREATE TYPE "InspeccionTipo" AS ENUM ('inspeccion_base', 'inspeccion_equipo');

-- CreateEnum
CREATE TYPE "RespuestaValor" AS ENUM ('si', 'no', 'na');

-- CreateTable
CREATE TABLE "SeccionInspeccion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "parentId" TEXT,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "SeccionInspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaInspeccion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "seccionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "parentPreguntaId" TEXT,
    "condicionRespuesta" TEXT,

    CONSTRAINT "PreguntaInspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionCorrectivaInspeccion" (
    "id" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "AccionCorrectivaInspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspeccionFormulario" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "InspeccionTipo" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "InspeccionEstado" NOT NULL DEFAULT 'borrador',
    "realizadoPorId" TEXT NOT NULL,
    "clientLocationId" TEXT,
    "lugarTexto" TEXT,
    "informeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspeccionFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspeccionRespuesta" (
    "id" TEXT NOT NULL,
    "formularioId" TEXT NOT NULL,
    "preguntaId" TEXT NOT NULL,
    "valor" "RespuestaValor" NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspeccionRespuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspeccionAccionSeleccionada" (
    "respuestaId" TEXT NOT NULL,
    "accionId" TEXT NOT NULL,

    CONSTRAINT "InspeccionAccionSeleccionada_pkey" PRIMARY KEY ("respuestaId","accionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeccionInspeccion_codigo_key" ON "SeccionInspeccion"("codigo");

-- CreateIndex
CREATE INDEX "SeccionInspeccion_parentId_idx" ON "SeccionInspeccion"("parentId");

-- CreateIndex
CREATE INDEX "SeccionInspeccion_orden_idx" ON "SeccionInspeccion"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "PreguntaInspeccion_codigo_key" ON "PreguntaInspeccion"("codigo");

-- CreateIndex
CREATE INDEX "PreguntaInspeccion_seccionId_idx" ON "PreguntaInspeccion"("seccionId");

-- CreateIndex
CREATE INDEX "PreguntaInspeccion_parentPreguntaId_idx" ON "PreguntaInspeccion"("parentPreguntaId");

-- CreateIndex
CREATE INDEX "PreguntaInspeccion_orden_idx" ON "PreguntaInspeccion"("orden");

-- CreateIndex
CREATE INDEX "AccionCorrectivaInspeccion_preguntaId_idx" ON "AccionCorrectivaInspeccion"("preguntaId");

-- CreateIndex
CREATE INDEX "AccionCorrectivaInspeccion_orden_idx" ON "AccionCorrectivaInspeccion"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "InspeccionFormulario_informeId_key" ON "InspeccionFormulario"("informeId");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_clienteId_idx" ON "InspeccionFormulario"("clienteId");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_realizadoPorId_idx" ON "InspeccionFormulario"("realizadoPorId");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_estado_idx" ON "InspeccionFormulario"("estado");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_tipo_idx" ON "InspeccionFormulario"("tipo");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_fecha_idx" ON "InspeccionFormulario"("fecha");

-- CreateIndex
CREATE INDEX "InspeccionFormulario_clientLocationId_idx" ON "InspeccionFormulario"("clientLocationId");

-- CreateIndex
CREATE INDEX "InspeccionRespuesta_formularioId_idx" ON "InspeccionRespuesta"("formularioId");

-- CreateIndex
CREATE INDEX "InspeccionRespuesta_preguntaId_idx" ON "InspeccionRespuesta"("preguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "InspeccionRespuesta_formularioId_preguntaId_key" ON "InspeccionRespuesta"("formularioId", "preguntaId");

-- CreateIndex
CREATE INDEX "InspeccionAccionSeleccionada_respuestaId_idx" ON "InspeccionAccionSeleccionada"("respuestaId");

-- AddForeignKey
ALTER TABLE "SeccionInspeccion" ADD CONSTRAINT "SeccionInspeccion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SeccionInspeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaInspeccion" ADD CONSTRAINT "PreguntaInspeccion_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "SeccionInspeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaInspeccion" ADD CONSTRAINT "PreguntaInspeccion_parentPreguntaId_fkey" FOREIGN KEY ("parentPreguntaId") REFERENCES "PreguntaInspeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionCorrectivaInspeccion" ADD CONSTRAINT "AccionCorrectivaInspeccion_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaInspeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionFormulario" ADD CONSTRAINT "InspeccionFormulario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionFormulario" ADD CONSTRAINT "InspeccionFormulario_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionFormulario" ADD CONSTRAINT "InspeccionFormulario_clientLocationId_fkey" FOREIGN KEY ("clientLocationId") REFERENCES "ClientLocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionFormulario" ADD CONSTRAINT "InspeccionFormulario_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "Informe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionRespuesta" ADD CONSTRAINT "InspeccionRespuesta_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "InspeccionFormulario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionRespuesta" ADD CONSTRAINT "InspeccionRespuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaInspeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionAccionSeleccionada" ADD CONSTRAINT "InspeccionAccionSeleccionada_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "InspeccionRespuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspeccionAccionSeleccionada" ADD CONSTRAINT "InspeccionAccionSeleccionada_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "AccionCorrectivaInspeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
