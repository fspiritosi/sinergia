"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react"
import moment from "moment"
import "moment/locale/es"

import {
  getPlanTrabajoProgramacionesByRange,
  type PlanTrabajoProgramacionCalendarItem,
} from "@/components/planesTrabajo/components/actions"
import { getInformesByRange, type InformeCalendarItem } from "@/components/informes/components/actions"
import { formatDateOnly, parseCalendarStringToDate } from "@/lib/dates"
import { transformarEventos, type CalendarioEvento } from "./types"
import { PlanificacionCalendarioGrid } from "./planificacion-calendario-grid"
import { PlanificacionCalendarioAgenda } from "./planificacion-calendario-agenda"

type VistaCalendario = 'calendario' | 'agenda'

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function toDayKey(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function monthKey(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

export function PlanificacionCalendarioView() {
  const [fechaActual, setFechaActual] = useState<Date>(() => new Date())
  const [vista, setVista] = useState<VistaCalendario>('calendario')
  const [selected, setSelected] = useState<Date | undefined>(() => new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [programaciones, setProgramaciones] = useState<PlanTrabajoProgramacionCalendarItem[]>([])
  const [informes, setInformes] = useState<InformeCalendarItem[]>([])
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'programacion' | 'informe'>('todos')

  const fechaMoment = moment(fechaActual)
  const mesActual = fechaMoment.month()
  const añoActual = fechaMoment.year()

  useEffect(() => {
    let isActive = true

    const fetchMonthData = async () => {
      setIsLoading(true)

      try {
        const from = startOfMonth(fechaActual).toISOString()
        const to = endOfMonth(fechaActual).toISOString()
        const [prog, inf] = await Promise.all([
          getPlanTrabajoProgramacionesByRange({ from, to }),
          getInformesByRange({ from, to }),
        ])

        if (!isActive) {
          return
        }

        setProgramaciones(prog)
        setInformes(inf)
      } catch (error: any) {
        if (!isActive) {
          return
        }

        console.error(error)
        toast.error(error?.message ?? "No se pudieron cargar las programaciones")
      } finally {
        if (!isActive) {
          return
        }

        setIsLoading(false)
      }
    }

    void fetchMonthData()

    return () => {
      isActive = false
    }
  }, [fechaActual])

  const mostrarProgramaciones = filtroTipo === 'todos' || filtroTipo === 'programacion'
  const mostrarInformes = filtroTipo === 'todos' || filtroTipo === 'informe'

  // Transformar eventos al formato unificado
  const eventos = useMemo(() => {
    return transformarEventos(programaciones, informes)
  }, [programaciones, informes])

  const eventosFiltradosPorTipo = useMemo(() => {
    return eventos.filter((evento) => {
      if (evento.tipo === 'programacion') {
        return mostrarProgramaciones
      }
      if (evento.tipo === 'informe') {
        return mostrarInformes
      }
      return true
    })
  }, [eventos, mostrarProgramaciones, mostrarInformes])

  // Filtrar eventos del mes actual
  const eventosDelMes = useMemo(() => {
    return eventosFiltradosPorTipo.filter(evento => {
      const fechaEvento = moment(evento.fecha_programada)
      // Para eventos mensuales, verificar que el mes coincida
      if (evento.tipo === 'programacion' && evento.precision === 'mes') {
        return fechaEvento.month() === mesActual && fechaEvento.year() === añoActual
      }
      // Para eventos diarios, verificar día y mes
      return fechaEvento.month() === mesActual && fechaEvento.year() === añoActual
    })
  }, [eventosFiltradosPorTipo, mesActual, añoActual])

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setFechaActual(prev => {
      const nuevaFecha = moment(prev)
      if (direccion === 'anterior') {
        nuevaFecha.subtract(1, 'month')
      } else {
        nuevaFecha.add(1, 'month')
      }
      return nuevaFecha.toDate()
    })
  }

  const irAHoy = () => {
    setFechaActual(new Date())
  }

  // Agrupar eventos por día para el panel de detalles
  const eventosPorDia = useMemo(() => {
    const map = new Map<string, CalendarioEvento[]>()
    
    eventosFiltradosPorTipo.forEach(evento => {
      if (evento.tipo === 'programacion' && evento.precision === 'mes') {
        // Para eventos mensuales, agregar a todos los días del mes
        const mesKey = moment(evento.fecha_programada).format('YYYY-MM')
        // No agregamos eventos mensuales al mapa por día, se manejan aparte
        return
      }
      
      const fecha = parseCalendarStringToDate(evento.fecha_programada)
      const key = toDayKey(fecha)
      const existing = map.get(key) ?? []
      existing.push(evento)
      map.set(key, existing)
    })
    
    return map
  }, [eventosFiltradosPorTipo])

  // Eventos mensuales del mes seleccionado
  const eventosMensuales = useMemo(() => {
    if (!mostrarProgramaciones) {
      return []
    }

    return eventosFiltradosPorTipo.filter(e => 
      e.tipo === 'programacion' && 
      e.precision === 'mes' &&
      moment(e.fecha_programada).month() === mesActual &&
      moment(e.fecha_programada).year() === añoActual
    ) as Array<Extract<CalendarioEvento, { tipo: 'programacion' }>>
  }, [eventosFiltradosPorTipo, mesActual, añoActual, mostrarProgramaciones])

  const selectedKey = selected ? toDayKey(selected) : null
  const selectedMonthKey = selected ? monthKey(selected) : null

  const eventosDelDiaSeleccionado = selectedKey ? eventosPorDia.get(selectedKey) ?? [] : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Planificación</CardTitle>
              <CardDescription>
                Calendario de programaciones de planes de trabajo
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              {/* Selector de vista */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={vista === 'calendario' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVista('calendario')}
                  className="h-8"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendario
                </Button>
                <Button
                  variant={vista === 'agenda' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVista('agenda')}
                  className="h-8"
                >
                  <List className="h-4 w-4 mr-1" />
                  Agenda
                </Button>
              </div>

              {/* Filtro de tipo de evento */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Mostrar</span>
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={filtroTipo === 'todos' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFiltroTipo('todos')}
                    className="h-8"
                  >
                    Ambos
                  </Button>
                  <Button
                    variant={filtroTipo === 'programacion' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFiltroTipo('programacion')}
                    className="h-8"
                  >
                    Planificados
                  </Button>
                  <Button
                    variant={filtroTipo === 'informe' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFiltroTipo('informe')}
                    className="h-8"
                  >
                    Informes
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={irAHoy}
                >
                  Hoy
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarMes('anterior')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[140px] text-center font-medium">
                    {fechaMoment.locale('es').format('MMMM YYYY')}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cambiarMes('siguiente')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vista === 'calendario' ? (
            <PlanificacionCalendarioGrid
              fecha={fechaActual}
              eventos={eventosDelMes}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <PlanificacionCalendarioAgenda
              fecha={fechaActual}
              eventos={eventosDelMes}
            />
          )}
          
          <div className="mt-4 text-xs text-muted-foreground">
            {isLoading
              ? "Cargando..."
              : `Programaciones en el mes: ${programaciones.length} · Informes en el mes: ${informes.length}`}
          </div>
        </CardContent>
      </Card>

      {/* Panel de detalles del día seleccionado */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Día {formatDateOnly(selected, "es-AR")}
              </div>
              <Badge variant={eventosDelDiaSeleccionado.length + eventosMensuales.length ? "secondary" : "outline"}>
                {eventosDelDiaSeleccionado.length + eventosMensuales.length} item(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {eventosDelDiaSeleccionado.length || eventosMensuales.length ? (
              <div className="space-y-4">
                {/* Programaciones del día */}
                {eventosDelDiaSeleccionado.filter(e => e.tipo === 'programacion' && e.precision === 'dia').length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Programaciones</div>
                    <div className="space-y-2">
                      {eventosDelDiaSeleccionado
                        .filter(e => e.tipo === 'programacion' && e.precision === 'dia')
                        .map((p) => {
                          const evento = p as Extract<CalendarioEvento, { tipo: 'programacion' }>
                          return (
                            <div key={evento.id} className="rounded-md border p-3">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-sm font-medium">{evento.item_nombre}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {evento.cliente_nombre} · Propuesta {evento.propuesta_codigo}
                                    {evento.client_location_nombre ? ` · ${evento.client_location_nombre}` : ""}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {evento.requiere_informe && (
                                    <Badge variant="outline">Genera informe</Badge>
                                  )}
                                  <Badge variant={evento.ejecutado ? "secondary" : "sinergia"}>
                                    {evento.ejecutado ? "Ejecutado" : "Pendiente"}
                                  </Badge>
                                  <Link
                                    href={`/dashboard/planes/${evento.plan_trabajo_id}`}
                                    className="text-xs underline text-muted-foreground"
                                  >
                                    Ver plan
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Programaciones mensuales */}
                {eventosMensuales.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Programaciones del mes</div>
                    <div className="space-y-2">
                      {eventosMensuales.map((p) => (
                        <div key={p.id} className="rounded-md border p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-medium">{p.item_nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.cliente_nombre} · Propuesta {p.propuesta_codigo}
                                {p.client_location_nombre ? ` · ${p.client_location_nombre}` : ""}
                                {" · (mes)"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {p.requiere_informe && (
                                <Badge variant="outline">Genera informe</Badge>
                              )}
                              <Badge variant={p.ejecutado ? "secondary" : "sinergia"}>
                                {p.ejecutado ? "Ejecutado" : "Pendiente"}
                              </Badge>
                              <Link
                                href={`/dashboard/planes/${p.plan_trabajo_id}`}
                                className="text-xs underline text-muted-foreground"
                              >
                                Ver plan
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informes */}
                {eventosDelDiaSeleccionado.filter(e => e.tipo === 'informe').length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Informes</div>
                    <div className="space-y-2">
                      {eventosDelDiaSeleccionado
                        .filter(e => e.tipo === 'informe')
                        .map((inf) => {
                          const evento = inf as Extract<CalendarioEvento, { tipo: 'informe' }>
                          const entregado = evento.estado === "entregado" && Boolean(evento.adjunto)
                          return (
                            <div key={evento.id} className="rounded-md border p-3">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="text-sm font-medium">{evento.tipo_informe_nombre}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {evento.cliente_nombre} · Propuesta {evento.propuesta_codigo}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={entregado ? "secondary" : "sinergia"}>
                                    {entregado ? "Entregado" : "Pendiente"}
                                  </Badge>
                                  <Link
                                    href={`/dashboard/informes`}
                                    className="text-xs underline text-muted-foreground"
                                  >
                                    Ver informes
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No hay programaciones para este día.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

