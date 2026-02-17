-- CreateIndex
CREATE INDEX "Ciudad_provinciaId_idx" ON "Ciudad"("provinciaId");

-- CreateIndex
CREATE INDEX "ClientLocations_clienteId_idx" ON "ClientLocations"("clienteId");

-- CreateIndex
CREATE INDEX "ClientLocations_provinciaId_idx" ON "ClientLocations"("provinciaId");

-- CreateIndex
CREATE INDEX "ClientLocations_ciudadId_idx" ON "ClientLocations"("ciudadId");

-- CreateIndex
CREATE INDEX "ClientLocations_is_active_idx" ON "ClientLocations"("is_active");

-- CreateIndex
CREATE INDEX "Cliente_is_active_idx" ON "Cliente"("is_active");

-- CreateIndex
CREATE INDEX "Cliente_name_idx" ON "Cliente"("name");

-- CreateIndex
CREATE INDEX "Cliente_provinciaId_idx" ON "Cliente"("provinciaId");

-- CreateIndex
CREATE INDEX "Cliente_ciudadId_idx" ON "Cliente"("ciudadId");

-- CreateIndex
CREATE INDEX "Cliente_createdAt_idx" ON "Cliente"("createdAt");

-- CreateIndex
CREATE INDEX "DetalleVariante_variantTypeId_idx" ON "DetalleVariante"("variantTypeId");

-- CreateIndex
CREATE INDEX "DetalleVariante_is_active_idx" ON "DetalleVariante"("is_active");

-- CreateIndex
CREATE INDEX "Informe_clienteId_idx" ON "Informe"("clienteId");

-- CreateIndex
CREATE INDEX "Informe_tipoDeInformeId_idx" ON "Informe"("tipoDeInformeId");

-- CreateIndex
CREATE INDEX "Informe_propuestaId_idx" ON "Informe"("propuestaId");

-- CreateIndex
CREATE INDEX "Informe_clientLocationId_idx" ON "Informe"("clientLocationId");

-- CreateIndex
CREATE INDEX "Informe_estado_idx" ON "Informe"("estado");

-- CreateIndex
CREATE INDEX "Informe_fechaVencimiento_idx" ON "Informe"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "Informe_createdAt_idx" ON "Informe"("createdAt");

-- CreateIndex
CREATE INDEX "Items_is_active_idx" ON "Items"("is_active");

-- CreateIndex
CREATE INDEX "Items_esPlanificable_idx" ON "Items"("esPlanificable");

-- CreateIndex
CREATE INDEX "Items_hasVariant_idx" ON "Items"("hasVariant");

-- CreateIndex
CREATE INDEX "Items_variantTypeId_idx" ON "Items"("variantTypeId");

-- CreateIndex
CREATE INDEX "Items_tipoDeInformeId_idx" ON "Items"("tipoDeInformeId");

-- CreateIndex
CREATE INDEX "PlanTrabajo_clienteId_idx" ON "PlanTrabajo"("clienteId");

-- CreateIndex
CREATE INDEX "PlanTrabajo_propuestaId_idx" ON "PlanTrabajo"("propuestaId");

-- CreateIndex
CREATE INDEX "PlanTrabajo_estado_idx" ON "PlanTrabajo"("estado");

-- CreateIndex
CREATE INDEX "PlanTrabajo_fechaInicio_idx" ON "PlanTrabajo"("fechaInicio");

-- CreateIndex
CREATE INDEX "PlanTrabajo_fechaFin_idx" ON "PlanTrabajo"("fechaFin");

-- CreateIndex
CREATE INDEX "PlanTrabajo_createdAt_idx" ON "PlanTrabajo"("createdAt");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_planTrabajoId_idx" ON "PlanTrabajoProgramacion"("planTrabajoId");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_itemId_idx" ON "PlanTrabajoProgramacion"("itemId");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_fechaProgramada_idx" ON "PlanTrabajoProgramacion"("fechaProgramada");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_clientLocationId_idx" ON "PlanTrabajoProgramacion"("clientLocationId");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_ejecutadoAt_idx" ON "PlanTrabajoProgramacion"("ejecutadoAt");

-- CreateIndex
CREATE INDEX "PlanTrabajoProgramacion_detalleVarianteId_idx" ON "PlanTrabajoProgramacion"("detalleVarianteId");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_clienteId_idx" ON "PropuestaTecnica"("clienteId");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_servicioId_idx" ON "PropuestaTecnica"("servicioId");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_status_idx" ON "PropuestaTecnica"("status");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_is_active_idx" ON "PropuestaTecnica"("is_active");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_vigencia_idx" ON "PropuestaTecnica"("vigencia");

-- CreateIndex
CREATE INDEX "PropuestaTecnica_createdAt_idx" ON "PropuestaTecnica"("createdAt");

-- CreateIndex
CREATE INDEX "Servicio_is_active_idx" ON "Servicio"("is_active");

-- CreateIndex
CREATE INDEX "Servicio_type_idx" ON "Servicio"("type");
