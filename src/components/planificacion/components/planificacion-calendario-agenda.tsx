"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import moment from "moment-timezone"
import "moment/locale/es"
import type { CalendarioEvento } from "./types"

const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires'

interface PlanificacionCalendarioAgendaProps {
  fecha: Date
  eventos: CalendarioEvento[]
}

export function PlanificacionCalendarioAgenda({ fecha, eventos }: PlanificacionCalendarioAgendaProps) {
  const fechaMoment = moment.tz(fecha, TIMEZONE_ARGENTINA)
  const año = fechaMoment.year()
  const mes = fechaMoment.month()

  // Agrupar eventos por fecha
  const eventosPorFecha = useMemo(() => {
    const map = new Map<string, CalendarioEvento[]>()
    
    eventos.forEach(evento => {
      if (evento.tipo === 'programacion' && evento.precision === 'mes') {
        // Para eventos mensuales, crear una entrada especial
        const mesKey = `mes-${moment(evento.fecha_programada).format('YYYY-MM')}`
        const existing = map.get(mesKey) ?? []
        existing.push(evento)
        map.set(mesKey, existing)
      } else {
        // Evento diario normal
        const fechaKey = moment(evento.fecha_programada).format('YYYY-MM-DD')
        const existing = map.get(fechaKey) ?? []
        existing.push(evento)
        map.set(fechaKey, existing)
      }
    })
    
    return map
  }, [eventos])

  // Obtener todas las fechas del mes que tienen eventos, ordenadas
  const fechasConEventos = useMemo(() => {
    const fechas: Array<{ fecha: string; esMensual: boolean }> = []
    
    eventosPorFecha.forEach((eventosDelDia, fechaKey) => {
      if (fechaKey.startsWith('mes-')) {
        // Es un evento mensual
        const mesKey = fechaKey.replace('mes-', '')
        const fechaEvento = moment.tz(mesKey, TIMEZONE_ARGENTINA)
        if (fechaEvento.month() === mes && fechaEvento.year() === año) {
          fechas.push({ fecha: fechaKey, esMensual: true })
        }
      } else {
        // Es un evento diario
        const fechaEvento = moment.tz(fechaKey, TIMEZONE_ARGENTINA)
        if (fechaEvento.month() === mes && fechaEvento.year() === año) {
          fechas.push({ fecha: fechaKey, esMensual: false })
        }
      }
    })
    
    // Ordenar: primero los eventos mensuales, luego los diarios ordenados por fecha
    return fechas.sort((a, b) => {
      if (a.esMensual && !b.esMensual) return -1
      if (!a.esMensual && b.esMensual) return 1
      if (a.esMensual && b.esMensual) {
        return a.fecha.localeCompare(b.fecha)
      }
      return a.fecha.localeCompare(b.fecha)
    })
  }, [eventosPorFecha, mes, año])

  if (fechasConEventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay eventos programados para este mes</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {fechasConEventos.map(({ fecha: fechaKey, esMensual }) => {
        const eventosDelDia = eventosPorFecha.get(fechaKey) ?? []
        
        let fechaDisplay: string
        if (esMensual) {
          const mesKey = fechaKey.replace('mes-', '')
          fechaDisplay = moment(mesKey).locale('es').format('MMMM YYYY')
        } else {
          fechaDisplay = moment(fechaKey).locale('es').format('dddd, D [de] MMMM')
        }

        // Separar eventos por tipo
        const programaciones = eventosDelDia.filter(e => e.tipo === 'programacion')
        const informes = eventosDelDia.filter(e => e.tipo === 'informe')

        return (
          <div key={fechaKey} className="space-y-3">
            {/* Header del día */}
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">
                {esMensual ? `Mes: ${fechaDisplay}` : fechaDisplay}
              </div>
              <div className="h-px bg-border flex-1"></div>
              <Badge variant="secondary">
                {eventosDelDia.length} {eventosDelDia.length === 1 ? 'evento' : 'eventos'}
              </Badge>
            </div>

            {/* Lista de eventos del día */}
            <div className="space-y-2 ml-4">
              {/* Programaciones */}
              {programaciones.map((evento) => {
                const prog = evento as Extract<CalendarioEvento, { tipo: 'programacion' }>
                return (
                  <div
                    key={prog.id}
                    className="bg-sinergia/10 after:bg-sinergia relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full border border-sinergia/20"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{prog.item_nombre}</div>
                        <div className="text-muted-foreground text-xs">
                          {prog.cliente_nombre} · Propuesta {prog.propuesta_codigo}
                          {prog.client_location_nombre ? ` · ${prog.client_location_nombre}` : ""}
                          {prog.precision === 'mes' ? " · (mes)" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prog.requiere_informe && (
                          <Badge variant="outline" className="text-xs">Genera informe</Badge>
                        )}
                        <Badge variant={prog.ejecutado ? "secondary" : "sinergia"} className="text-xs">
                          {prog.ejecutado ? "Ejecutado" : "Pendiente"}
                        </Badge>
                        <Link
                          href={`/dashboard/planes/${prog.plan_trabajo_id}`}
                          className="text-xs underline text-muted-foreground hover:text-foreground"
                        >
                          Ver plan
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Informes */}
              {informes.map((evento) => {
                const inf = evento as Extract<CalendarioEvento, { tipo: 'informe' }>
                const entregado = inf.estado === "entregado" && Boolean(inf.adjunto)
                return (
                  <div
                    key={inf.id}
                    className="bg-indigo-100/50 after:bg-indigo-600 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full border border-indigo-200/50 dark:bg-indigo-950/30 dark:border-indigo-800/30"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{inf.tipo_informe_nombre}</div>
                        <div className="text-muted-foreground text-xs">
                          {inf.cliente_nombre} · Propuesta {inf.propuesta_codigo}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={entregado ? "secondary" : "sinergia"} className="text-xs">
                          {entregado ? "Entregado" : "Pendiente"}
                        </Badge>
                        <Link
                          href={`/dashboard/informes`}
                          className="text-xs underline text-muted-foreground hover:text-foreground"
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
        )
      })}
    </div>
  )
}

