"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { PlanTrabajoWithProgramaciones } from "./actions"
import {
  createPlanTrabajoProgramacion,
  marcarProgramacionEjecutada,
  previewUpdatePlanTrabajoFechas,
  reprogramarPlanTrabajoProgramacion,
  updatePlanTrabajoFechas,
} from "./actions"
import { getActiveClientLocations, type ClientLocationBasic } from "@/components/clientLocations/components/actions"
import { formatDateOnly, parseCalendarStringToDate, toDateOnlyString, toMonthOnlyString } from "@/lib/dates"
import { useDashboardTitle } from "@/components/dashboard/DashboardTitleContext"

interface PlanTrabajoDetailViewProps {
  plan: PlanTrabajoWithProgramaciones
}

function formatEstado(estado: string): string {
  switch (estado) {
    case "pendiente_programacion":
      return "Pendiente de Programación"
    case "programado_incompleto":
      return "Programado incompleto"
    case "programado_completo":
      return "Programado completo"
    case "en_desarrollo":
      return "En desarrollo"
    case "finalizado_con_pendientes":
      return "Finalizado con pendientes"
    case "finalizado_completo":
      return "Finalizado completo"
    default:
      return estado
  }
}

function formatDate(value: Date | string): string {
  return formatDateOnly(value, "es-AR")
}

export function PlanTrabajoDetailView({ plan }: PlanTrabajoDetailViewProps) {
  const router = useRouter()
  const { setTitle } = useDashboardTitle()
  const [programarOpen, setProgramarOpen] = useState(false)
  const [editarFechasOpen, setEditarFechasOpen] = useState(false)
  const [editarProgramacionId, setEditarProgramacionId] = useState<string | null>(null)
  const [editarProgramacionPrecision, setEditarProgramacionPrecision] = useState<"dia" | "mes">("dia")
  const [editarProgramacionFechaDia, setEditarProgramacionFechaDia] = useState("")
  const [editarProgramacionFechaMes, setEditarProgramacionFechaMes] = useState("")
  const [editarProgramacionSaving, setEditarProgramacionSaving] = useState(false)

  const canProgramar = useMemo(() => {
    return (
      plan.estado === "pendiente_programacion" ||
      plan.estado === "programado_incompleto" ||
      plan.estado === "programado_completo"
    )
  }, [plan.estado])

  const pendingCount = useMemo(() => {
    return plan.programaciones.filter((p) => !p.ejecutadoAt && p.informe?.estado !== "entregado").length
  }, [plan.programaciones])

  const programacionEnEdicion = useMemo(() => {
    return plan.programaciones.find((p) => p.id === editarProgramacionId) ?? null
  }, [editarProgramacionId, plan.programaciones])

  useEffect(() => {
    setTitle(`${plan.cliente.name} - Propuesta ${plan.propuesta.codigo}`)
    return () => setTitle(null)
  }, [plan.cliente.name, plan.propuesta.codigo, setTitle])

  const pendingPlanificarCount = useMemo(() => {
    const itemIdsPropuesta = new Set(plan.propuestaItemsDetalle.map((item) => item.id))
    const itemIdsProgramados = new Set(plan.programaciones.map((p) => p.item.id))

    let count = 0
    for (const itemId of itemIdsPropuesta) {
      if (!itemIdsProgramados.has(itemId)) count += 1
    }

    return count
  }, [plan.programaciones, plan.propuestaItemsDetalle])

  const canEditarFechas = useMemo(() => {
    return plan.estado !== "finalizado_con_pendientes" && plan.estado !== "finalizado_completo"
  }, [plan.estado])

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
              <Badge variant={plan.estado === "pendiente_programacion" ? "sinergia" : "secondary"}>
                {formatEstado(plan.estado)}
              </Badge>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programaciones</CardTitle>
          <CardDescription>Pendientes y ejecuciones dentro del plan</CardDescription>
        </CardHeader>
        <CardContent>
          {plan.programaciones.length ? (
            <div className="space-y-2">
              {plan.programaciones.map((p) => {
                const ejecutado = Boolean(p.ejecutadoAt) || p.informe?.estado === "entregado"
                const requiereInforme = Boolean(p.item.tipoDeInformeId)

                return (
                  <div key={p.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{p.item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Programado: {formatDate(p.fechaProgramada)}
                        {p.precision === "mes" ? " (mes)" : ""}
                        {p.clientLocation ? ` - ${p.clientLocation.name}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={ejecutado ? "secondary" : "sinergia"}>
                        {ejecutado ? "Ejecutado" : "Pendiente"}
                      </Badge>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditarProgramacionId(p.id)

                          const nextPrecision: "dia" | "mes" = requiereInforme ? "dia" : (p.precision as "dia" | "mes")
                          setEditarProgramacionPrecision(nextPrecision)

                          const fechaDia = toDateOnlyString(p.fechaProgramada)
                          const fechaMes = toMonthOnlyString(p.fechaProgramada)
                          setEditarProgramacionFechaDia(fechaDia)
                          setEditarProgramacionFechaMes(fechaMes)
                        }}
                      >
                        Editar fecha
                      </Button>

                      {!requiereInforme ? (
                        <Button
                          type="button"
                          variant={ejecutado ? "outline" : "default"}
                          onClick={async () => {
                            try {
                              await marcarProgramacionEjecutada({
                                programacionId: p.id,
                                ejecutada: !ejecutado,
                              })
                              toast.success(ejecutado ? "Pendiente reabierto" : "Marcado como ejecutado")
                              router.refresh()
                            } catch (error) {
                              console.error(error)
                              toast.error("No se pudo actualizar la ejecución")
                            }
                          }}
                        >
                          {ejecutado ? "Desmarcar" : "Ejecutar"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay programaciones para este plan.</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editarProgramacionId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditarProgramacionId(null)
            setEditarProgramacionSaving(false)
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
                <Label>{editarProgramacionPrecision === "mes" && !programacionEnEdicion.item.tipoDeInformeId ? "Mes *" : "Fecha *"}</Label>
                <Input
                  type={editarProgramacionPrecision === "mes" && !programacionEnEdicion.item.tipoDeInformeId ? "month" : "date"}
                  value={editarProgramacionPrecision === "mes" && !programacionEnEdicion.item.tipoDeInformeId ? editarProgramacionFechaMes : editarProgramacionFechaDia}
                  onChange={(e) => {
                    if (editarProgramacionPrecision === "mes" && !programacionEnEdicion.item.tipoDeInformeId) {
                      setEditarProgramacionFechaMes(e.target.value)
                    } else {
                      setEditarProgramacionFechaDia(e.target.value)
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
                if (!programacionEnEdicion) return

                const requiereInforme = Boolean(programacionEnEdicion.item.tipoDeInformeId)
                const nextPrecision = requiereInforme ? "dia" : editarProgramacionPrecision
                const fechaProgramada =
                  nextPrecision === "mes" ? editarProgramacionFechaMes : editarProgramacionFechaDia

                if (!fechaProgramada) {
                  toast.error("Completá la nueva fecha")
                  return
                }

                setEditarProgramacionSaving(true)
                try {
                  await reprogramarPlanTrabajoProgramacion({
                    programacionId: programacionEnEdicion.id,
                    precision: nextPrecision,
                    fechaProgramada: nextPrecision === "mes" ? `${fechaProgramada}-01` : fechaProgramada,
                    rangoInicio: toDateOnlyString(plan.fechaInicio),
                    rangoFin: toDateOnlyString(plan.fechaFin),
                  })
                  toast.success("Fecha actualizada")
                  setEditarProgramacionId(null)
                  router.refresh()
                } catch (error: any) {
                  console.error(error)
                  toast.error(error?.message ?? "No se pudo actualizar la fecha")
                } finally {
                  setEditarProgramacionSaving(false)
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
    </div>
  )
}

function toDateInputValue(value: Date | string): string {
  if (value instanceof Date) return toDateOnlyString(value)
  if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return value
  try {
    return toDateOnlyString(parseCalendarStringToDate(value))
  } catch {
    return ""
  }
}

function EditarFechasDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PlanTrabajoWithProgramaciones
  onSaved: () => void
}) {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reprogramandoIds, setReprogramandoIds] = useState<Record<string, boolean>>({})
  const [fueraDeRango, setFueraDeRango] = useState<
    Array<{
      programacionId: string
      itemId: string
      itemName: string
      fechaProgramada: string
      precision: "dia" | "mes"
      requiereInforme: boolean
      informeId: string | null
    }>
  >([])

  const [reprogDrafts, setReprogDrafts] = useState<
    Record<
      string,
      {
        precision: "dia" | "mes"
        fechaDia: string
        fechaMes: string
      }
    >
  >({})

  useEffect(() => {
    if (!open) {
      setFueraDeRango([])
      setReprogDrafts({})
      setReprogramandoIds({})
      return
    }

    setFechaInicio(toDateInputValue(plan.fechaInicio))
    setFechaFin(toDateInputValue(plan.fechaFin))
    setFueraDeRango([])
    setReprogDrafts({})
    setReprogramandoIds({})
  }, [open, plan.fechaInicio, plan.fechaFin])

  const handlePreview = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Completá fecha de inicio y fin")
      return
    }

    setIsPreviewing(true)
    try {
      const result = await previewUpdatePlanTrabajoFechas({
        planTrabajoId: plan.id,
        fechaInicio,
        fechaFin,
      })

      setFueraDeRango(result.fueraDeRango ?? [])

      setReprogDrafts((prev) => {
        const next = { ...prev }
        for (const p of result.fueraDeRango ?? []) {
          if (!next[p.programacionId]) {
            next[p.programacionId] = {
              precision: p.requiereInforme ? "dia" : p.precision,
              fechaDia: toDateInputValue(p.fechaProgramada),
              fechaMes: "",
            }
          }
        }
        return next
      })

      if ((result.fueraDeRango ?? []).length > 0) {
        toast.error("Hay programaciones fuera del rango. Reprogramalas antes de guardar las nuevas fechas.")
      } else {
        toast.success("Sin conflictos. Podés guardar las nuevas fechas.")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message ?? "No se pudo previsualizar")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSave = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Completá fecha de inicio y fin")
      return
    }

    if (fueraDeRango.length > 0) {
      toast.error("No podés guardar: hay programaciones fuera del rango")
      return
    }

    setIsSaving(true)
    try {
      const result = await updatePlanTrabajoFechas({
        planTrabajoId: plan.id,
        fechaInicio,
        fechaFin,
      })

      if (!result.success) {
        toast.error(result.reason ?? "No se pudieron actualizar las fechas")
        setFueraDeRango((result as any).fueraDeRango ?? [])
        return
      }

      toast.success("Fechas actualizadas")
      onOpenChange(false)
      onSaved()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message ?? "No se pudieron actualizar las fechas")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Editar fechas del plan</DialogTitle>
          <DialogDescription>
            Si al cambiar el rango quedan programaciones fuera, vas a tener que reprogramarlas primero.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Inicio *</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fin *</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={handlePreview} disabled={isPreviewing || isSaving}>
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
                  }

                  const precision = p.requiereInforme ? "dia" : draft.precision
                  const isReprogramando = Boolean(reprogramandoIds[p.programacionId])

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
                                }))
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
                              const value = e.target.value
                              setReprogDrafts((prev) => ({
                                ...prev,
                                [p.programacionId]: {
                                  ...draft,
                                  precision,
                                  fechaDia: precision === "mes" ? draft.fechaDia : value,
                                  fechaMes: precision === "mes" ? value : "",
                                },
                              }))
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          onClick={async () => {
                            const nextDraft = reprogDrafts[p.programacionId] ?? draft
                            const nextPrecision = p.requiereInforme ? "dia" : nextDraft.precision
                            const fechaProgramada =
                              nextPrecision === "mes" ? `${nextDraft.fechaMes}-01` : nextDraft.fechaDia

                            if (!fechaProgramada || fechaProgramada === "-01") {
                              toast.error("Completá la nueva fecha")
                              return
                            }

                            setReprogramandoIds((prev) => ({ ...prev, [p.programacionId]: true }))
                            try {
                              await reprogramarPlanTrabajoProgramacion({
                                programacionId: p.programacionId,
                                fechaProgramada,
                                precision: nextPrecision,
                                rangoInicio: fechaInicio,
                                rangoFin: fechaFin,
                              })
                              toast.success("Programación reprogramada")
                              await handlePreview()
                            } catch (error: any) {
                              console.error(error)
                              toast.error(error?.message ?? "No se pudo reprogramar")
                            } finally {
                              setReprogramandoIds((prev) => ({ ...prev, [p.programacionId]: false }))
                            }
                          }}
                          disabled={isPreviewing || isSaving || isReprogramando}
                          className="bg-sinergia text-white hover:bg-sinergia-hover"
                        >
                          {isReprogramando ? "Reprogramando..." : "Reprogramar"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Reprogramá estas fechas (o eliminá/recreá programaciones) para poder guardar el nuevo rango.
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPreviewing || isSaving}>
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
  )
}

function ProgramarDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PlanTrabajoWithProgramaciones
}) {
  const [itemId, setItemId] = useState("")
  const [precision, setPrecision] = useState<"dia" | "mes">("dia")
  const [fechaDia, setFechaDia] = useState("")
  const [fechaMes, setFechaMes] = useState("")
  const [locationId, setLocationId] = useState("")
  const [locations, setLocations] = useState<ClientLocationBasic[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const programacionesCountByItemId = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of plan.programaciones) {
      counts[p.item.id] = (counts[p.item.id] ?? 0) + 1
    }
    return counts
  }, [plan.programaciones])

  const selectedItem = useMemo(() => {
    return plan.propuestaItemsDetalle.find((i) => i.id === itemId) ?? null
  }, [itemId, plan.propuestaItemsDetalle])

  const requiereInforme = Boolean(selectedItem?.tipoDeInformeId)

  useEffect(() => {
    if (!open) {
      setItemId("")
      setPrecision("dia")
      setFechaDia("")
      setFechaMes("")
      setLocationId("")
      return
    }
  }, [open])

  useEffect(() => {
    if (!requiereInforme) return
    setPrecision("dia")
    setFechaMes("")
  }, [requiereInforme])

  useEffect(() => {
    if (!open) return

    let isMounted = true
    setLocationsLoading(true)

    getActiveClientLocations(plan.cliente.id)
      .then((result) => {
        if (!isMounted) return
        setLocations(result)
      })
      .catch((error) => {
        console.error("Error al cargar locaciones del cliente:", error)
        if (!isMounted) return
        toast.error("No se pudieron cargar las locaciones del cliente")
      })
      .finally(() => {
        if (!isMounted) return
        setLocationsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, plan.cliente.id])

  const itemsUnicos = useMemo(() => {
    return plan.propuestaItemsDetalle
  }, [plan.propuestaItemsDetalle])

  const handleSubmit = async () => {
    if (!itemId) {
      toast.error("Seleccioná un item")
      return
    }

    if (requiereInforme) {
      if (!locationId) {
        toast.error("Seleccioná la locación del cliente")
        return
      }
      if (!fechaDia) {
        toast.error("Completá la fecha")
        return
      }
    } else {
      if (precision === "dia" && !fechaDia) {
        toast.error("Completá la fecha")
        return
      }
      if (precision === "mes" && !fechaMes) {
        toast.error("Completá el mes")
        return
      }
    }

    const fechaProgramada = precision === "mes" ? `${fechaMes}-01` : fechaDia

    setIsSubmitting(true)
    try {
      await createPlanTrabajoProgramacion({
        planTrabajoId: plan.id,
        itemId,
        fechaProgramada,
        precision,
        clientLocationId: requiereInforme ? locationId : undefined,
      })
      toast.success("Programación creada")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message ?? "No se pudo crear la programación")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Programar item</DialogTitle>
          <DialogDescription>
            La fecha programada debe estar dentro del rango del plan ({formatDate(plan.fechaInicio)} a {formatDate(plan.fechaFin)}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Item *</Label>
            <Select value={itemId || undefined} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder={itemsUnicos.length ? "Seleccioná un item" : "Sin items"} />
              </SelectTrigger>
              <SelectContent>
                {itemsUnicos.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({programacionesCountByItemId[item.id] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {itemsUnicos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Todavía no cargamos los items de la propuesta en esta pantalla. El próximo paso es listarlos desde la propuesta.
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

          <div className="space-y-2">
            <Label>{precision === "mes" && !requiereInforme ? "Mes *" : "Fecha *"}</Label>
            <Input
              type={precision === "mes" && !requiereInforme ? "month" : "date"}
              value={precision === "mes" && !requiereInforme ? fechaMes : fechaDia}
              onChange={(e) => {
                if (precision === "mes" && !requiereInforme) setFechaMes(e.target.value)
                else setFechaDia(e.target.value)
              }}
            />
          </div>

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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-sinergia text-white hover:bg-sinergia-hover">
            {isSubmitting ? "Guardando..." : "Programar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
