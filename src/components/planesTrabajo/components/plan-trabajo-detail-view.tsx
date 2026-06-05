"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FileText, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PlanTrabajoWithProgramaciones } from "./actions";
import {
  createPlanTrabajoProgramacion,
  createPlanTrabajoProgramacionesMensuales,
  marcarProgramacionEjecutada,
  ejecutarProgramacionConAdjunto,
  previewUpdatePlanTrabajoFechas,
  reprogramarPlanTrabajoProgramacion,
  updatePlanTrabajoFechas,
  deletePlanTrabajoProgramacion,
} from "./actions";
import { PlanTrabajoPDFViewerDialog } from "./pdf-viewer-dialog";
import {
  getActiveClientLocations,
  type ClientLocationBasic,
} from "@/components/clientLocations/components/actions";
import {
  formatDateOnly,
  isValidDate,
  parseCalendarStringToDate,
  parseMonthOnlyToLocalNoon,
  toDateOnlyString,
  toMonthOnlyString,
} from "@/lib/dates";
import { useDashboardTitle } from "@/components/dashboard/DashboardTitleContext";

interface PlanTrabajoDetailViewProps {
  plan: PlanTrabajoWithProgramaciones;
}

function formatEstado(estado: string): string {
  switch (estado) {
    case "pendiente_programacion":
      return "Pendiente de Programación";
    case "programado_incompleto":
      return "Programado incompleto";
    case "programado_completo":
      return "Programado completo";
    case "en_desarrollo":
      return "En desarrollo";
    case "finalizado_con_pendientes":
      return "Finalizado con pendientes";
    case "finalizado_completo":
      return "Finalizado completo";
    default:
      return estado;
  }
}

function formatDate(value: Date | string): string {
  return formatDateOnly(value, "es-AR");
}

export function PlanTrabajoDetailView({ plan }: PlanTrabajoDetailViewProps) {
  const router = useRouter();
  const { setTitle } = useDashboardTitle();
  const [programarOpen, setProgramarOpen] = useState(false);
  const [editarFechasOpen, setEditarFechasOpen] = useState(false);
  const [editarProgramacionId, setEditarProgramacionId] = useState<string | null>(null);
  const [editarProgramacionPrecision, setEditarProgramacionPrecision] = useState<"dia" | "mes">(
    "dia"
  );
  const [editarProgramacionFechaDia, setEditarProgramacionFechaDia] = useState("");
  const [editarProgramacionFechaMes, setEditarProgramacionFechaMes] = useState("");
  const [editarProgramacionSaving, setEditarProgramacionSaving] = useState(false);
  const [ejecutarProgramacionId, setEjecutarProgramacionId] = useState<string | null>(null);
  const [ejecutarFile, setEjecutarFile] = useState<File | null>(null);
  const [ejecutarLoading, setEjecutarLoading] = useState(false);
  const [eliminarProgramacionId, setEliminarProgramacionId] = useState<string | null>(null);
  const [eliminarProgramacionSaving, setEliminarProgramacionSaving] = useState(false);
  const [verAdjuntoProgramacionId, setVerAdjuntoProgramacionId] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [textoFiltro, setTextoFiltro] = useState("");
  const [fechaFiltroDia, setFechaFiltroDia] = useState("");
  const [fechaFiltroMes, setFechaFiltroMes] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "pendiente" | "ejecutado">("todos");

  const canProgramar = useMemo(() => {
    return (
      plan.estado === "pendiente_programacion" ||
      plan.estado === "programado_incompleto" ||
      plan.estado === "programado_completo"
    );
  }, [plan.estado]);

  const pendingCount = useMemo(() => {
    return plan.programaciones.filter((p) => !p.ejecutadoAt && p.informe?.estado !== "entregado")
      .length;
  }, [plan.programaciones]);

  const programacionEnEdicion = useMemo(() => {
    return plan.programaciones.find((p) => p.id === editarProgramacionId) ?? null;
  }, [editarProgramacionId, plan.programaciones]);

  const programacionAEjecutar = useMemo(() => {
    return plan.programaciones.find((p) => p.id === ejecutarProgramacionId) ?? null;
  }, [ejecutarProgramacionId, plan.programaciones]);

  const programacionConAdjunto = useMemo(() => {
    return plan.programaciones.find((p) => p.id === verAdjuntoProgramacionId) ?? null;
  }, [verAdjuntoProgramacionId, plan.programaciones]);

  const programacionesFiltradas = useMemo(() => {
    const texto = textoFiltro.trim().toLowerCase();

    return plan.programaciones.filter((p) => {
      const ejecutado = Boolean(p.ejecutadoAt) || p.informe?.estado === "entregado";
      const matchesEstado =
        estadoFiltro === "todos" || (estadoFiltro === "ejecutado" ? ejecutado : !ejecutado);

      const fechaProgramadaDate =
        p.fechaProgramada instanceof Date
          ? p.fechaProgramada
          : parseCalendarStringToDate(p.fechaProgramada as string);
      const fechaProgramadaDia = toDateOnlyString(fechaProgramadaDate);
      const fechaProgramadaMes = toMonthOnlyString(fechaProgramadaDate);

      const matchesDia = !fechaFiltroDia || fechaProgramadaDia === fechaFiltroDia;
      const matchesMes = !fechaFiltroMes || fechaProgramadaMes === fechaFiltroMes;

      const itemNombre = p.detalleVariante
        ? `${p.item.name} - ${p.detalleVariante.name}`
        : p.item.name;
      const textoBuscado = `${itemNombre} ${p.clientLocation?.name ?? ""}`.toLowerCase();
      const matchesTexto = !texto || textoBuscado.includes(texto);

      return matchesEstado && matchesDia && matchesMes && matchesTexto;
    });
  }, [plan.programaciones, estadoFiltro, fechaFiltroDia, fechaFiltroMes, textoFiltro]);

  const filtrosActivos = Boolean(
    textoFiltro.trim() || fechaFiltroDia || fechaFiltroMes || estadoFiltro !== "todos"
  );

  useEffect(() => {
    setTitle(`${plan.cliente.name} - Propuesta ${plan.propuesta.codigo}`);
    return () => setTitle(null);
  }, [plan.cliente.name, plan.propuesta.codigo, setTitle]);

  const pendingPlanificarCount = useMemo(() => {
    const itemIdsPropuesta = new Set(
      plan.propuestaItemsDetalle
        .filter((item) => item.tipoDeInformeId || item.esPlanificable)
        .map((item) => item.id)
    );
    const itemIdsProgramados = new Set(plan.programaciones.map((p) => p.item.id));

    let count = 0;
    for (const itemId of itemIdsPropuesta) {
      if (!itemIdsProgramados.has(itemId)) count += 1;
    }

    return count;
  }, [plan.programaciones, plan.propuestaItemsDetalle]);

  const nonPlanificablesCount = useMemo(() => {
    return plan.propuestaItemsDetalle.filter(
      (item) => !item.tipoDeInformeId && !item.esPlanificable
    ).length;
  }, [plan.propuestaItemsDetalle]);

  const canEditarFechas = useMemo(() => {
    return plan.estado !== "finalizado_con_pendientes" && plan.estado !== "finalizado_completo";
  }, [plan.estado]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Plan de trabajo</CardTitle>
              <CardDescription>
                {plan.cliente.name} - Propuesta {plan.propuesta.codigo}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={plan.estado === "pendiente_programacion" ? "warning" : "default"}>
                {formatEstado(plan.estado)}
              </Badge>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPdfOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              {canEditarFechas ? (
                <Button type="button" variant="outline" onClick={() => setEditarFechasOpen(true)}>
                  Editar fechas
                </Button>
              ) : null}
              {canProgramar ? (
                <Button
                  type="button"
                  onClick={() => setProgramarOpen(true)}
                  className="bg-sinergia text-white hover:bg-sinergia-hover"
                >
                  Programar
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Inicio</p>
              <p className="text-sm font-medium">{formatDate(plan.fechaInicio)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fin</p>
              <p className="text-sm font-medium">{formatDate(plan.fechaFin)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes de Planificar</p>
              <p className="text-sm font-medium">{pendingPlanificarCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes de Ejecución</p>
              <p className="text-sm font-medium">{pendingCount}</p>
            </div>
            <div className="sm:col-span-4 md:col-span-1">
              <p className="text-sm text-muted-foreground">Items no planificables</p>
              <p className="text-sm font-medium">{nonPlanificablesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(ejecutarProgramacionId)}
        onOpenChange={(open) => {
          if (!open) {
            setEjecutarProgramacionId(null);
            setEjecutarFile(null);
            setEjecutarLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Subir evidencia de ejecución</DialogTitle>
            <DialogDescription>
              Adjuntá un archivo para marcar la programación como ejecutada.
            </DialogDescription>
          </DialogHeader>

          {programacionAEjecutar ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {programacionAEjecutar.detalleVariante
                    ? `${programacionAEjecutar.item.name} - ${programacionAEjecutar.detalleVariante.name}`
                    : programacionAEjecutar.item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Programado: {formatDate(programacionAEjecutar.fechaProgramada)}
                  {programacionAEjecutar.precision === "mes" ? " (mes)" : ""}
                  {programacionAEjecutar.clientLocation
                    ? ` - ${programacionAEjecutar.clientLocation.name}`
                    : ""}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adjunto *</Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setEjecutarFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={ejecutarLoading}
              onClick={() => {
                setEjecutarProgramacionId(null);
                setEjecutarFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={ejecutarLoading || !programacionAEjecutar}
              onClick={async () => {
                if (!programacionAEjecutar) return;
                if (!ejecutarFile) {
                  toast.error("Adjuntá un archivo");
                  return;
                }
                setEjecutarLoading(true);
                try {
                  const formData = new FormData();
                  formData.append("programacionId", programacionAEjecutar.id);
                  formData.append("file", ejecutarFile);
                  await ejecutarProgramacionConAdjunto(formData);
                  toast.success("Programación marcada como ejecutada");
                  setEjecutarProgramacionId(null);
                  setEjecutarFile(null);
                  router.refresh();
                } catch (error: any) {
                  toast.error(error?.message ?? "No se pudo ejecutar la programación");
                } finally {
                  setEjecutarLoading(false);
                }
              }}
            >
              {ejecutarLoading ? "Guardando..." : "Confirmar ejecución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Programaciones</CardTitle>
          <CardDescription>Pendientes y ejecuciones dentro del plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label htmlFor="filtro-texto-programaciones">Buscar item</Label>
                <Input
                  id="filtro-texto-programaciones"
                  placeholder="Nombre del item o locación"
                  value={textoFiltro}
                  onChange={(event) => setTextoFiltro(event.target.value)}
                />
              </div>
              <div>
                <Label>Fecha (día)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFiltroDia && "text-muted-foreground"
                      )}
                    >
                      {fechaFiltroDia
                        ? formatDateOnly(fechaFiltroDia, "es-AR")
                        : "Seleccioná un día"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      selected={
                        fechaFiltroDia ? parseCalendarStringToDate(fechaFiltroDia) : undefined
                      }
                      onSelect={(date) => {
                        if (!date) {
                          setFechaFiltroDia("");
                          return;
                        }
                        setFechaFiltroDia(toDateOnlyString(date));
                      }}
                      defaultMonth={
                        fechaFiltroDia ? parseCalendarStringToDate(fechaFiltroDia) : undefined
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Mes</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaFiltroMes && "text-muted-foreground"
                      )}
                    >
                      {fechaFiltroMes
                        ? parseMonthOnlyToLocalNoon(fechaFiltroMes).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "long",
                          })
                        : "Seleccioná un mes"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      selected={
                        fechaFiltroMes ? parseMonthOnlyToLocalNoon(fechaFiltroMes) : undefined
                      }
                      onMonthChange={(date) => {
                        const monthValue = toMonthOnlyString(date);
                        setFechaFiltroMes(monthValue);
                      }}
                      onSelect={(date) => {
                        if (!date) {
                          setFechaFiltroMes("");
                          return;
                        }
                        const monthValue = toMonthOnlyString(date);
                        setFechaFiltroMes(monthValue);
                      }}
                      defaultMonth={
                        fechaFiltroMes ? parseMonthOnlyToLocalNoon(fechaFiltroMes) : undefined
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={estadoFiltro}
                  onValueChange={(value: "todos" | "pendiente" | "ejecutado") =>
                    setEstadoFiltro(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="ejecutado">Ejecutados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                Mostrando {programacionesFiltradas.length} de {plan.programaciones.length}{" "}
                programaciones
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setTextoFiltro("");
                  setFechaFiltroDia("");
                  setFechaFiltroMes("");
                  setEstadoFiltro("todos");
                }}
                disabled={!filtrosActivos}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>

          {programacionesFiltradas.length ? (
            <div className="space-y-2">
              {programacionesFiltradas.map((p) => {
                const ejecutado = Boolean(p.ejecutadoAt) || p.informe?.estado === "entregado";
                const requiereInforme = Boolean(p.item.tipoDeInformeId);
                const itemNombre = p.detalleVariante
                  ? `${p.item.name} - ${p.detalleVariante.name}`
                  : p.item.name;

                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{itemNombre}</div>
                      <div className="text-xs text-muted-foreground">
                        Programado: {formatDate(p.fechaProgramada)}
                        {p.precision === "mes" ? " (mes)" : ""}
                        {p.clientLocation ? ` - ${p.clientLocation.name}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={ejecutado ? "sinergia" : "warning"}>
                        {ejecutado ? "Ejecutado" : "Pendiente"}
                      </Badge>

                      {!p.ejecutadoAt ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditarProgramacionId(p.id);

                            const nextPrecision: "dia" | "mes" = requiereInforme
                              ? "dia"
                              : (p.precision as "dia" | "mes");
                            setEditarProgramacionPrecision(nextPrecision);

                            const fechaDia = toDateOnlyString(p.fechaProgramada);
                            const fechaMes = toMonthOnlyString(p.fechaProgramada);
                            setEditarProgramacionFechaDia(fechaDia);
                            setEditarProgramacionFechaMes(fechaMes);
                          }}
                        >
                          Editar fecha
                        </Button>
                      ) : null}

                      {!requiereInforme ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            if (ejecutado) {
                              if (!p.adjunto) {
                                toast.error("Esta ejecución no tiene adjunto cargado");
                                return;
                              }
                              setVerAdjuntoProgramacionId(p.id);
                            } else {
                              setEjecutarProgramacionId(p.id);
                            }
                          }}
                        >
                          {ejecutado ? "Ver evidencia" : "Ejecutar"}
                        </Button>
                      ) : null}

                      {!ejecutado ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label="Eliminar programación"
                          onClick={() => setEliminarProgramacionId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {filtrosActivos
                ? "No hay programaciones que coincidan con los filtros aplicados."
                : "Todavía no hay programaciones para este plan."}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(eliminarProgramacionId)}
        onOpenChange={(open) => {
          if (!open) setEliminarProgramacionId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta programación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
              {plan.programaciones.find((p) => p.id === eliminarProgramacionId)?.informe
                ? " También se eliminará el informe pendiente asociado a esta programación."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminarProgramacionSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminarProgramacionSaving}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                if (!eliminarProgramacionId) return;
                setEliminarProgramacionSaving(true);
                try {
                  await deletePlanTrabajoProgramacion(eliminarProgramacionId);
                  toast.success("Programación eliminada");
                  setEliminarProgramacionId(null);
                  router.refresh();
                } catch (error: any) {
                  toast.error(error?.message ?? "No se pudo eliminar la programación");
                } finally {
                  setEliminarProgramacionSaving(false);
                }
              }}
            >
              {eliminarProgramacionSaving ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(verAdjuntoProgramacionId)}
        onOpenChange={(open) => {
          if (!open) {
            setVerAdjuntoProgramacionId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Evidencia de ejecución</DialogTitle>
            <DialogDescription>
              Visualizá el adjunto subido al ejecutar la programación.
            </DialogDescription>
          </DialogHeader>

          {programacionConAdjunto ? (
            <div className="flex-1 min-h-0 rounded-md border overflow-hidden bg-muted">
              <iframe
                src={`/api/planes-trabajo/programaciones/file/${programacionConAdjunto.id}`}
                className="h-full w-full"
                title="Adjunto de programación"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerAdjuntoProgramacionId(null)}
            >
              Cerrar
            </Button>
            {programacionConAdjunto ? (
              <Button
                type="button"
                onClick={() =>
                  window.open(
                    `/api/planes-trabajo/programaciones/file/${programacionConAdjunto.id}`,
                    "_blank"
                  )
                }
              >
                Descargar
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editarProgramacionId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditarProgramacionId(null);
            setEditarProgramacionSaving(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar fecha programada</DialogTitle>
            <DialogDescription>
              Ajustá la fecha o mes de programación del item seleccionado.
            </DialogDescription>
          </DialogHeader>

          {programacionEnEdicion ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">{programacionEnEdicion.item.name}</div>
                <div className="text-xs text-muted-foreground">
                  Actual: {formatDate(programacionEnEdicion.fechaProgramada)}
                  {programacionEnEdicion.precision === "mes" ? " (mes)" : ""}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {editarProgramacionPrecision === "mes" &&
                  !programacionEnEdicion.item.tipoDeInformeId
                    ? "Mes *"
                    : "Fecha *"}
                </Label>
                <Input
                  type={
                    editarProgramacionPrecision === "mes" &&
                    !programacionEnEdicion.item.tipoDeInformeId
                      ? "month"
                      : "date"
                  }
                  value={
                    editarProgramacionPrecision === "mes" &&
                    !programacionEnEdicion.item.tipoDeInformeId
                      ? editarProgramacionFechaMes
                      : editarProgramacionFechaDia
                  }
                  onChange={(e) => {
                    if (
                      editarProgramacionPrecision === "mes" &&
                      !programacionEnEdicion.item.tipoDeInformeId
                    ) {
                      setEditarProgramacionFechaMes(e.target.value);
                    } else {
                      setEditarProgramacionFechaDia(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={editarProgramacionSaving}
              onClick={() => setEditarProgramacionId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={editarProgramacionSaving || !programacionEnEdicion}
              onClick={async () => {
                if (!programacionEnEdicion) return;

                const requiereInforme = Boolean(programacionEnEdicion.item.tipoDeInformeId);
                const nextPrecision = requiereInforme ? "dia" : editarProgramacionPrecision;
                const fechaProgramada =
                  nextPrecision === "mes" ? editarProgramacionFechaMes : editarProgramacionFechaDia;

                if (!fechaProgramada) {
                  toast.error("Completá la nueva fecha");
                  return;
                }

                setEditarProgramacionSaving(true);
                try {
                  await reprogramarPlanTrabajoProgramacion({
                    programacionId: programacionEnEdicion.id,
                    precision: nextPrecision,
                    fechaProgramada:
                      nextPrecision === "mes" ? `${fechaProgramada}-01` : fechaProgramada,
                    rangoInicio: toDateOnlyString(plan.fechaInicio),
                    rangoFin: toDateOnlyString(plan.fechaFin),
                  });
                  toast.success("Fecha actualizada");
                  setEditarProgramacionId(null);
                  router.refresh();
                } catch (error: any) {
                  toast.error(error?.message ?? "No se pudo actualizar la fecha");
                } finally {
                  setEditarProgramacionSaving(false);
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProgramarDialog open={programarOpen} onOpenChange={setProgramarOpen} plan={plan} />
      <EditarFechasDialog
        open={editarFechasOpen}
        onOpenChange={setEditarFechasOpen}
        plan={plan}
        onSaved={() => router.refresh()}
      />
      <PlanTrabajoPDFViewerDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        planTrabajoId={plan.id}
        propuestaCodigo={plan.propuesta.codigo}
      />
    </div>
  );
}

function toDateInputValue(value: Date | string): string {
  if (value instanceof Date) return toDateOnlyString(value);
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return value;
  try {
    return toDateOnlyString(parseCalendarStringToDate(value));
  } catch {
    return "";
  }
}

function EditarFechasDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanTrabajoWithProgramaciones;
  onSaved: () => void;
}) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reprogramandoIds, setReprogramandoIds] = useState<Record<string, boolean>>({});
  const [fueraDeRango, setFueraDeRango] = useState<
    Array<{
      programacionId: string;
      itemId: string;
      itemName: string;
      fechaProgramada: string;
      precision: "dia" | "mes";
      requiereInforme: boolean;
      informeId: string | null;
    }>
  >([]);

  const [reprogDrafts, setReprogDrafts] = useState<
    Record<
      string,
      {
        precision: "dia" | "mes";
        fechaDia: string;
        fechaMes: string;
      }
    >
  >({});

  useEffect(() => {
    if (!open) {
      setFueraDeRango([]);
      setReprogDrafts({});
      setReprogramandoIds({});
      return;
    }

    setFechaInicio(toDateInputValue(plan.fechaInicio));
    setFechaFin(toDateInputValue(plan.fechaFin));
    setFueraDeRango([]);
    setReprogDrafts({});
    setReprogramandoIds({});
  }, [open, plan.fechaInicio, plan.fechaFin]);

  const handlePreview = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Completá fecha de inicio y fin");
      return;
    }

    setIsPreviewing(true);
    try {
      const result = await previewUpdatePlanTrabajoFechas({
        planTrabajoId: plan.id,
        fechaInicio,
        fechaFin,
      });

      setFueraDeRango(result.fueraDeRango ?? []);

      setReprogDrafts((prev) => {
        const next = { ...prev };
        for (const p of result.fueraDeRango ?? []) {
          if (!next[p.programacionId]) {
            next[p.programacionId] = {
              precision: p.requiereInforme ? "dia" : p.precision,
              fechaDia: toDateInputValue(p.fechaProgramada),
              fechaMes: "",
            };
          }
        }
        return next;
      });

      if ((result.fueraDeRango ?? []).length > 0) {
        toast.error(
          "Hay programaciones fuera del rango. Reprogramalas antes de guardar las nuevas fechas."
        );
      } else {
        toast.success("Sin conflictos. Podés guardar las nuevas fechas.");
      }
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo previsualizar");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Completá fecha de inicio y fin");
      return;
    }

    if (fueraDeRango.length > 0) {
      toast.error("No podés guardar: hay programaciones fuera del rango");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePlanTrabajoFechas({
        planTrabajoId: plan.id,
        fechaInicio,
        fechaFin,
      });

      if (!result.success) {
        toast.error(result.reason ?? "No se pudieron actualizar las fechas");
        setFueraDeRango((result as any).fueraDeRango ?? []);
        return;
      }

      toast.success("Fechas actualizadas");
      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudieron actualizar las fechas");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Editar fechas del plan</DialogTitle>
          <DialogDescription>
            Si al cambiar el rango quedan programaciones fuera, vas a tener que reprogramarlas
            primero.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Inicio *</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin *</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={isPreviewing || isSaving}
            >
              {isPreviewing ? "Previsualizando..." : "Previsualizar"}
            </Button>
            {fueraDeRango.length ? (
              <Badge variant="sinergia">Fuera de rango: {fueraDeRango.length}</Badge>
            ) : (
              <Badge variant="secondary">Sin conflictos</Badge>
            )}
          </div>

          {fueraDeRango.length ? (
            <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Programaciones fuera de rango</div>
              <div className="space-y-3">
                {fueraDeRango.map((p) => {
                  const draft = reprogDrafts[p.programacionId] ?? {
                    precision: p.requiereInforme ? "dia" : p.precision,
                    fechaDia: toDateInputValue(p.fechaProgramada),
                    fechaMes: "",
                  };

                  const precision = p.requiereInforme ? "dia" : draft.precision;
                  const isReprogramando = Boolean(reprogramandoIds[p.programacionId]);

                  return (
                    <div key={p.programacionId} className="rounded-md border p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{p.itemName}</div>
                          <div className="text-xs text-muted-foreground">
                            Actual: {formatDate(p.fechaProgramada)}
                            {p.precision === "mes" ? " (mes)" : ""}
                            {p.requiereInforme ? " (requiere informe)" : ""}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {!p.requiereInforme ? (
                          <div className="space-y-2">
                            <Label>Precisión</Label>
                            <Select
                              value={precision}
                              onValueChange={(v) => {
                                setReprogDrafts((prev) => ({
                                  ...prev,
                                  [p.programacionId]: {
                                    ...draft,
                                    precision: v as "dia" | "mes",
                                    fechaMes: v === "mes" ? draft.fechaMes : "",
                                  },
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dia">Día</SelectItem>
                                <SelectItem value="mes">Mes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

                        <div className="space-y-2 sm:col-span-2">
                          <Label>{precision === "mes" ? "Mes" : "Fecha"}</Label>
                          <Input
                            type={precision === "mes" ? "month" : "date"}
                            value={precision === "mes" ? draft.fechaMes : draft.fechaDia}
                            onChange={(e) => {
                              const value = e.target.value;
                              setReprogDrafts((prev) => ({
                                ...prev,
                                [p.programacionId]: {
                                  ...draft,
                                  precision,
                                  fechaDia: precision === "mes" ? draft.fechaDia : value,
                                  fechaMes: precision === "mes" ? value : "",
                                },
                              }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          onClick={async () => {
                            const nextDraft = reprogDrafts[p.programacionId] ?? draft;
                            const nextPrecision = p.requiereInforme ? "dia" : nextDraft.precision;
                            const fechaProgramada =
                              nextPrecision === "mes"
                                ? `${nextDraft.fechaMes}-01`
                                : nextDraft.fechaDia;

                            if (!fechaProgramada || fechaProgramada === "-01") {
                              toast.error("Completá la nueva fecha");
                              return;
                            }

                            setReprogramandoIds((prev) => ({ ...prev, [p.programacionId]: true }));
                            try {
                              await reprogramarPlanTrabajoProgramacion({
                                programacionId: p.programacionId,
                                fechaProgramada,
                                precision: nextPrecision,
                                rangoInicio: fechaInicio,
                                rangoFin: fechaFin,
                              });
                              toast.success("Programación reprogramada");
                              await handlePreview();
                            } catch (error: any) {
                              toast.error(error?.message ?? "No se pudo reprogramar");
                            } finally {
                              setReprogramandoIds((prev) => ({
                                ...prev,
                                [p.programacionId]: false,
                              }));
                            }
                          }}
                          disabled={isPreviewing || isSaving || isReprogramando}
                          className="bg-sinergia text-white hover:bg-sinergia-hover"
                        >
                          {isReprogramando ? "Reprogramando..." : "Reprogramar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Reprogramá estas fechas (o eliminá/recreá programaciones) para poder guardar el
                nuevo rango.
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPreviewing || isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPreviewing || isSaving || fueraDeRango.length > 0}
            className="bg-sinergia text-white hover:bg-sinergia-hover"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgramarDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanTrabajoWithProgramaciones;
}) {
  const [itemId, setItemId] = useState("");
  const [precision, setPrecision] = useState<"dia" | "mes">("dia");
  const [fechaDia, setFechaDia] = useState("");
  const [fechaMes, setFechaMes] = useState("");
  const [mesInicioSerie, setMesInicioSerie] = useState("");
  const [planificarTodosLosMeses, setPlanificarTodosLosMeses] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [detalleVarianteId, setDetalleVarianteId] = useState("");
  const [locations, setLocations] = useState<ClientLocationBasic[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const programacionesCountByItemId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of plan.programaciones) {
      counts[p.item.id] = (counts[p.item.id] ?? 0) + 1;
    }
    return counts;
  }, [plan.programaciones]);

  const selectedItem = useMemo(() => {
    return plan.propuestaItemsDetalle.find((i) => i.id === itemId) ?? null;
  }, [itemId, plan.propuestaItemsDetalle]);

  const requiereInforme = Boolean(selectedItem?.tipoDeInformeId);

  useEffect(() => {
    if (!open) {
      setItemId("");
      setPrecision("dia");
      setFechaDia("");
      setFechaMes("");
      setMesInicioSerie("");
      setPlanificarTodosLosMeses(false);
      setLocationId("");
      setDetalleVarianteId("");
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!requiereInforme) return;
    setPrecision("dia");
    setFechaMes("");
  }, [requiereInforme]);

  const requiereDetalleVariante = Boolean(selectedItem?.hasVariant);

  const detallesDisponibles = useMemo(() => {
    if (!requiereDetalleVariante || !selectedItem?.variantTypeId) {
      return [];
    }
    return plan.detallesVariante.filter(
      (detalle) => detalle.variantTypeId === selectedItem.variantTypeId
    );
  }, [plan.detallesVariante, requiereDetalleVariante, selectedItem]);

  useEffect(() => {
    if (!requiereDetalleVariante) {
      setDetalleVarianteId("");
      return;
    }

    if (detallesDisponibles.length === 0) {
      setDetalleVarianteId("");
      return;
    }

    const stillValid = detallesDisponibles.some((detalle) => detalle.id === detalleVarianteId);
    if (!stillValid) {
      setDetalleVarianteId("");
    }
  }, [requiereDetalleVariante, detallesDisponibles, detalleVarianteId]);

  useEffect(() => {
    if (requiereDetalleVariante && planificarTodosLosMeses) {
      setPlanificarTodosLosMeses(false);
    }
  }, [planificarTodosLosMeses, requiereDetalleVariante]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLocationsLoading(true);

    getActiveClientLocations(plan.cliente.id)
      .then((result) => {
        if (!isMounted) return;
        setLocations(result);
      })
      .catch((error) => {
        if (!isMounted) return;
        toast.error("No se pudieron cargar las locaciones del cliente");
      })
      .finally(() => {
        if (!isMounted) return;
        setLocationsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, plan.cliente.id]);

  const itemsUnicos = useMemo(() => {
    return plan.propuestaItemsDetalle;
  }, [plan.propuestaItemsDetalle]);

  const mesInicioPorDefecto = useMemo(() => {
    const start = plan.fechaInicio instanceof Date ? plan.fechaInicio : new Date(plan.fechaInicio);
    if (!isValidDate(start)) return "";
    return toMonthOnlyString(start);
  }, [plan.fechaInicio]);

  useEffect(() => {
    if (!mesInicioSerie && mesInicioPorDefecto) {
      setMesInicioSerie(mesInicioPorDefecto);
    }
  }, [mesInicioPorDefecto, mesInicioSerie]);

  const mesesCreadosCount = useMemo(() => {
    if (!planificarTodosLosMeses) return 0;
    if (!mesInicioSerie) return 0;
    try {
      const start = parseMonthOnlyToLocalNoon(mesInicioSerie);
      const planStart = new Date(plan.fechaInicio.getFullYear(), plan.fechaInicio.getMonth(), 1);
      const planEnd = new Date(plan.fechaFin.getFullYear(), plan.fechaFin.getMonth(), 1);
      const effectiveStart = start.getTime() < planStart.getTime() ? planStart : start;
      if (effectiveStart.getTime() > planEnd.getTime()) return 0;
      let count = 0;
      let cursor = new Date(effectiveStart);
      while (cursor.getTime() <= planEnd.getTime()) {
        count += 1;
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
      return count;
    } catch {
      return 0;
    }
  }, [mesInicioSerie, plan.fechaFin, plan.fechaInicio, planificarTodosLosMeses]);

  const handleSubmit = async () => {
    if (!itemId) {
      toast.error("Seleccioná un item");
      return;
    }

    if (requiereInforme) {
      if (!locationId) {
        toast.error("Seleccioná la locación del cliente");
        return;
      }
      if (!fechaDia) {
        toast.error("Completá la fecha");
        return;
      }
    } else if (!planificarTodosLosMeses) {
      if (precision === "dia" && !fechaDia) {
        toast.error("Completá la fecha");
        return;
      }
      if (precision === "mes" && !fechaMes) {
        toast.error("Completá el mes");
        return;
      }
    }

    if (requiereDetalleVariante) {
      if (detallesDisponibles.length === 0) {
        toast.error("No hay detalles de variante disponibles para este item");
        return;
      }
      if (!detalleVarianteId) {
        toast.error("Seleccioná el detalle de variante");
        return;
      }
    }

    const fechaProgramada = precision === "mes" ? `${fechaMes}-01` : fechaDia;

    setIsSubmitting(true);
    try {
      if (!requiereInforme && planificarTodosLosMeses) {
        if (!mesInicioSerie) {
          toast.error("Completá el mes de inicio");
          return;
        }
        await createPlanTrabajoProgramacionesMensuales({
          planTrabajoId: plan.id,
          itemId,
          mesInicio: mesInicioSerie,
        });
        toast.success("Programaciones creadas");
      } else {
        await createPlanTrabajoProgramacion({
          planTrabajoId: plan.id,
          itemId,
          fechaProgramada,
          precision,
          clientLocationId: requiereInforme ? locationId : undefined,
          detalleVarianteId: requiereDetalleVariante ? detalleVarianteId : undefined,
        });
        toast.success("Programación creada");
      }
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear la programación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Programar item</DialogTitle>
          <DialogDescription>
            La fecha programada debe estar dentro del rango del plan ({formatDate(plan.fechaInicio)}{" "}
            a {formatDate(plan.fechaFin)}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Item *</Label>
            <Select value={itemId || undefined} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={itemsUnicos.length ? "Seleccioná un item" : "Sin items"}
                />
              </SelectTrigger>
              <SelectContent>
                {itemsUnicos.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <span>
                        {item.name} ({programacionesCountByItemId[item.id] ?? 0})
                      </span>
                      {!item.tipoDeInformeId && !item.esPlanificable ? (
                        <Badge variant="warning">No planificable</Badge>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {itemsUnicos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Todavía no cargamos los items de la propuesta en esta pantalla. El próximo paso es
                listarlos desde la propuesta.
              </p>
            ) : null}
          </div>

          {!requiereInforme ? (
            <div className="space-y-2">
              <Label>Precisión *</Label>
              <Select value={precision} onValueChange={(v) => setPrecision(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Día</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {!requiereInforme ? (
            <div className="flex items-center gap-2">
              <input
                id="planificar-serie"
                type="checkbox"
                className="h-4 w-4 accent-sinergia"
                checked={planificarTodosLosMeses}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPlanificarTodosLosMeses(checked);
                  if (checked) {
                    setPrecision("mes");
                  }
                }}
                disabled={requiereDetalleVariante}
              />
              <Label htmlFor="planificar-serie" className="text-sm">
                Planificar en todos los meses del plan
              </Label>
              {requiereDetalleVariante ? (
                <p className="text-xs text-muted-foreground">
                  Los items con variantes se planifican individualmente.
                </p>
              ) : null}
            </div>
          ) : null}

          {planificarTodosLosMeses && !requiereInforme ? (
            <div className="space-y-2">
              <Label>Mes de inicio *</Label>
              <Input
                type="month"
                value={mesInicioSerie}
                min={mesInicioPorDefecto || undefined}
                onChange={(e) => setMesInicioSerie(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se crearán {mesesCreadosCount} programación(es) mensual(es) dentro del rango del
                plan.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{precision === "mes" && !requiereInforme ? "Mes *" : "Fecha *"}</Label>
              <Input
                type={precision === "mes" && !requiereInforme ? "month" : "date"}
                value={precision === "mes" && !requiereInforme ? fechaMes : fechaDia}
                onChange={(e) => {
                  if (precision === "mes" && !requiereInforme) setFechaMes(e.target.value);
                  else setFechaDia(e.target.value);
                }}
              />
            </div>
          )}

          {requiereInforme ? (
            <div className="space-y-2">
              <Label>Locación del cliente *</Label>
              <Select
                value={locationId || undefined}
                onValueChange={setLocationId}
                disabled={locationsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locationsLoading
                        ? "Cargando locaciones..."
                        : locations.length
                          ? "Seleccioná una locación"
                          : "No hay locaciones activas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {requiereDetalleVariante ? (
            <div className="space-y-2">
              <Label>Detalle de Variante *</Label>
              <Select
                value={detalleVarianteId || undefined}
                onValueChange={setDetalleVarianteId}
                disabled={detallesDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      detallesDisponibles.length
                        ? "Seleccioná un detalle"
                        : "No hay detalles activos para esta variante"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {detallesDisponibles.map((detalle) => (
                    <SelectItem key={detalle.id} value={detalle.id}>
                      {detalle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!detallesDisponibles.length ? (
                <p className="text-xs text-muted-foreground">
                  Creá detalles activos para esta variante antes de planificar.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-sinergia text-white hover:bg-sinergia-hover"
          >
            {isSubmitting ? "Guardando..." : "Programar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
