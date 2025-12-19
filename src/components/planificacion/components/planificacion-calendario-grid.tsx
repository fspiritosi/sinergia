"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import moment from "moment-timezone"
import "moment/locale/es"
import type { CalendarioEvento } from "./types"

// Configurar el timezone según tu región
const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires'

interface PlanificacionCalendarioGridProps {
  fecha: Date
  eventos: CalendarioEvento[]
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function PlanificacionCalendarioGrid({ 
  fecha, 
  eventos, 
  selected,
  onSelect 
}: PlanificacionCalendarioGridProps) {
  const fechaMoment = moment.tz(fecha, TIMEZONE_ARGENTINA)
  const año = fechaMoment.year()
  const mes = fechaMoment.month()

  // Primer día del mes
  const primerDia = moment.tz(fecha, TIMEZONE_ARGENTINA).startOf('month')
  // Último día del mes
  const ultimoDia = moment.tz(fecha, TIMEZONE_ARGENTINA).endOf('month')

  // Día de la semana del primer día (0 = domingo)
  const primerDiaSemana = primerDia.day()

  // Total de días en el mes
  const diasEnMes = ultimoDia.date()

  // Crear array de días para mostrar
  const dias: Array<{
    dia: number
    esDelMesActual: boolean
    fecha: Date
  }> = []

  // Días del mes anterior (para completar la primera semana)
  const mesAnterior = moment.tz(fecha, TIMEZONE_ARGENTINA).subtract(1, 'month').endOf('month')
  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const fechaDia = moment.tz(mesAnterior, TIMEZONE_ARGENTINA).subtract(i, 'days')
    dias.push({
      dia: fechaDia.date(),
      esDelMesActual: false,
      fecha: fechaDia.toDate()
    })
  }

  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaDia = moment.tz(fecha, TIMEZONE_ARGENTINA).date(dia)
    dias.push({
      dia,
      esDelMesActual: true,
      fecha: fechaDia.toDate()
    })
  }

  // Días del mes siguiente (para completar la última semana)
  const diasRestantes = 42 - dias.length // 6 semanas * 7 días
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const fechaDia = moment.tz(fecha, TIMEZONE_ARGENTINA).add(1, 'month').date(dia)
    dias.push({
      dia,
      esDelMesActual: false,
      fecha: fechaDia.toDate()
    })
  }

  // Agrupar eventos por fecha
  const eventosPorFecha = useMemo(() => {
    const map = new Map<string, CalendarioEvento[]>()
    
    eventos.forEach(evento => {
      if (evento.tipo === 'programacion' && evento.precision === 'mes') {
        // Para eventos mensuales, agregar a todos los días del mes actual
        const mesKey = moment(evento.fecha_programada).format('YYYY-MM')
        const mesEvento = moment(evento.fecha_programada).month()
        const añoEvento = moment(evento.fecha_programada).year()
        
        // Solo agregar si es del mes actual
        if (mesEvento === mes && añoEvento === año) {
          // Agregar a todos los días del mes
          for (let dia = 1; dia <= diasEnMes; dia++) {
            const fechaDia = moment.tz(fecha, TIMEZONE_ARGENTINA).date(dia)
            const key = fechaDia.format('YYYY-MM-DD')
            const existing = map.get(key) ?? []
            existing.push(evento)
            map.set(key, existing)
          }
        }
      } else {
        // Evento diario normal
        const fechaKey = evento.fecha_programada
        // Asegurarse de que la fecha esté en formato YYYY-MM-DD
        const fechaFormateada = moment(fechaKey).format('YYYY-MM-DD')
        const existing = map.get(fechaFormateada) ?? []
        existing.push(evento)
        map.set(fechaFormateada, existing)
      }
    })
    
    return map
  }, [eventos, mes, año, diasEnMes, fecha])

  const hoy = moment.tz(TIMEZONE_ARGENTINA)
  const esHoy = (fecha: Date) => {
    return moment.tz(fecha, TIMEZONE_ARGENTINA).isSame(hoy, 'day')
  }

  const esSeleccionado = (fecha: Date) => {
    if (!selected) return false
    return moment.tz(fecha, TIMEZONE_ARGENTINA).isSame(moment.tz(selected, TIMEZONE_ARGENTINA), 'day')
  }

  const handleDiaClick = (fecha: Date) => {
    if (onSelect) {
      onSelect(esSeleccionado(fecha) ? undefined : fecha)
    }
  }

  return (
    <div className="w-full">
      {/* Header con días de la semana */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {diasSemana.map(dia => (
          <div key={dia} className="bg-muted p-2 text-center text-sm font-medium text-muted-foreground">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden">
        {dias.map((diaInfo, index) => {
          const fechaKey = moment.tz(diaInfo.fecha, TIMEZONE_ARGENTINA).format('YYYY-MM-DD')
          const eventosDelDia = eventosPorFecha.get(fechaKey) ?? []
          
          // Separar eventos por tipo
          const programaciones = eventosDelDia.filter(e => e.tipo === 'programacion')
          const informes = eventosDelDia.filter(e => e.tipo === 'informe')

          return (
            <div
              key={index}
              onClick={() => handleDiaClick(diaInfo.fecha)}
              className={cn(
                "bg-background min-h-[120px] p-2 flex flex-col cursor-pointer transition-colors",
                !diaInfo.esDelMesActual && "bg-muted/50 text-muted-foreground",
                esHoy(diaInfo.fecha) && "bg-primary/5 ring-2 ring-primary/20",
                esSeleccionado(diaInfo.fecha) && "ring-2 ring-primary ring-offset-2",
                "hover:bg-accent/50"
              )}
            >
              {/* Número del día */}
              <div className={cn(
                "text-sm font-medium mb-1",
                esHoy(diaInfo.fecha) && "text-primary font-bold",
                esSeleccionado(diaInfo.fecha) && "text-primary font-bold"
              )}>
                {diaInfo.dia}
              </div>

              {/* Eventos del día */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {/* Mostrar máximo 2 eventos, priorizando programaciones */}
                {[...programaciones.slice(0, 2), ...informes.slice(0, Math.max(0, 2 - programaciones.length))].map((evento, idx: number) => {
                  const esProgramacion = evento.tipo === 'programacion'
                  const esInforme = evento.tipo === 'informe'
                  
                  return (
                    <div
                      key={`${evento.id}-${idx}`}
                      className={cn(
                        "relative rounded-md p-1 pl-3 text-xs after:absolute after:inset-y-1 after:left-1 after:w-0.5 after:rounded-full",
                        esProgramacion && "bg-sinergia/10 after:bg-sinergia text-foreground",
                        esInforme && "bg-indigo-100/50 after:bg-indigo-600 text-indigo-foreground dark:bg-indigo-950/30 dark:text-indigo-300"
                      )}
                      title={
                        esProgramacion 
                          ? `${evento.item_nombre} - ${evento.cliente_nombre}`
                          : `${evento.tipo_informe_nombre} - ${evento.cliente_nombre}`
                      }
                    >
                      <div className="font-medium truncate">
                        {esProgramacion ? evento.item_nombre : evento.tipo_informe_nombre}
                      </div>
                      <div className="text-muted-foreground truncate text-[10px]">
                        {evento.cliente_nombre}
                      </div>
                    </div>
                  )
                })}

                {/* Mostrar contador si hay más eventos */}
                {eventosDelDia.length > 2 && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{eventosDelDia.length - 2} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

