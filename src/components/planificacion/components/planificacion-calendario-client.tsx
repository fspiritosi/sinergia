"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { es } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"

import {
  getPlanTrabajoProgramacionesByRange,
  type PlanTrabajoProgramacionCalendarItem,
} from "@/components/planesTrabajo/components/actions"
import { getInformesByRange, type InformeCalendarItem } from "@/components/informes/components/actions"

function toDayKey(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function parseISOToDate(value: string): Date {
  const d = new Date(value)
  return d
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function monthKey(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${yyyy}-${mm}`
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("es-AR")
}

export function PlanificacionCalendarioClient() {
  const [month, setMonth] = useState<Date>(() => new Date())
  const [selected, setSelected] = useState<Date | undefined>(() => new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PlanTrabajoProgramacionCalendarItem[]>([])
  const [informes, setInformes] = useState<InformeCalendarItem[]>([])

  const loadMonth = async (targetMonth: Date) => {
    const from = startOfMonth(targetMonth).toISOString()
    const to = endOfMonth(targetMonth).toISOString()

    setIsLoading(true)
    try {
      const [prog, inf] = await Promise.all([
        getPlanTrabajoProgramacionesByRange({ from, to }),
        getInformesByRange({ from, to }),
      ])

      setItems(prog)
      setInformes(inf)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message ?? "No se pudieron cargar las programaciones")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMonth(month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progByDay = useMemo(() => {
    const map = new Map<string, PlanTrabajoProgramacionCalendarItem[]>()
    for (const it of items) {
      if (it.precision !== "dia") continue
      const d = parseISOToDate(it.fechaProgramada)
      const key = toDayKey(d)
      const existing = map.get(key) ?? []
      existing.push(it)
      map.set(key, existing)
    }
    return map
  }, [items])

  const progMesByMonth = useMemo(() => {
    const map = new Map<string, PlanTrabajoProgramacionCalendarItem[]>()
    for (const it of items) {
      if (it.precision !== "mes") continue
      const d = parseISOToDate(it.fechaProgramada)
      const key = monthKey(d)
      const existing = map.get(key) ?? []
      existing.push(it)
      map.set(key, existing)
    }
    return map
  }, [items])

  const informesByDay = useMemo(() => {
    const map = new Map<string, InformeCalendarItem[]>()
    for (const inf of informes) {
      const d = parseISOToDate(inf.fechaVencimiento)
      const key = toDayKey(d)
      const existing = map.get(key) ?? []
      existing.push(inf)
      map.set(key, existing)
    }
    return map
  }, [informes])

  const calendarModifiers = useMemo(() => {
    const keysProg = Array.from(progByDay.keys())
    const keysInf = Array.from(informesByDay.keys())

    const allKeys = Array.from(new Set([...keysProg, ...keysInf]))
    const all = allKeys.map((key) => new Date(`${key}T00:00:00`))

    const dia = keysProg.map((key) => new Date(`${key}T00:00:00`))
    const inf = keysInf.map((key) => new Date(`${key}T00:00:00`))

    return {
      all,
      dia,
      inf,
    }
  }, [progByDay, informesByDay])

  const selectedKey = selected ? toDayKey(selected) : null
  const selectedMonthKey = selected ? monthKey(selected) : null

  const selectedProgDia = selectedKey ? progByDay.get(selectedKey) ?? [] : []
  const selectedProgMes = selectedMonthKey ? progMesByMonth.get(selectedMonthKey) ?? [] : []
  const selectedInformes = selectedKey ? informesByDay.get(selectedKey) ?? [] : []

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-3">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          locale={es}
          month={month}
          onMonthChange={async (m) => {
            setMonth(m)
            await loadMonth(m)
          }}
          modifiers={{
            hasEvents: calendarModifiers.all,
            hasDia: calendarModifiers.dia,
            hasInforme: calendarModifiers.inf,
          }}
          modifiersClassNames={{
            hasDia: "rounded-md bg-sinergia text-white hover:bg-sinergia-hover",
            hasInforme: "rounded-md bg-indigo-600 text-white hover:bg-indigo-700",
          }}
          className="rounded-md border"
        />
        <div className="text-xs text-muted-foreground">
          {isLoading
            ? "Cargando..."
            : `Programaciones en el mes: ${items.length} · Informes en el mes: ${informes.length}`}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {selected ? `Día ${formatDate(selected)}` : "Seleccioná un día"}
          </div>
          <Badge variant={selectedProgDia.length + selectedProgMes.length + selectedInformes.length ? "secondary" : "outline"}>
            {selectedProgDia.length + selectedProgMes.length + selectedInformes.length} item(s)
          </Badge>
        </div>

        {selected ? (
          selectedProgDia.length || selectedProgMes.length || selectedInformes.length ? (
            <div className="space-y-4">
              {selectedProgDia.length || selectedProgMes.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Programaciones</div>
                  <div className="space-y-2">
                    {[...selectedProgDia, ...selectedProgMes].map((p) => (
                <div key={p.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">{p.itemNombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.clienteNombre} · Propuesta {p.propuestaCodigo}
                        {p.clientLocationNombre ? ` · ${p.clientLocationNombre}` : ""}
                        {p.precision === "mes" ? " · (mes)" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.requiereInforme ? <Badge variant="outline">Genera informe</Badge> : null}
                      <Badge variant={p.ejecutado ? "secondary" : "sinergia"}>
                        {p.ejecutado ? "Ejecutado" : "Pendiente"}
                      </Badge>
                      <Link
                        href={`/dashboard/planes/${p.planTrabajoId}`}
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
              ) : null}

              {selectedInformes.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Informes</div>
                  <div className="space-y-2">
                    {selectedInformes.map((inf) => {
                      const entregado = inf.estado === "entregado" && Boolean(inf.adjunto)
                      return (
                        <div key={inf.id} className="rounded-md border p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-medium">{inf.tipoDeInformeNombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {inf.clienteNombre} · Propuesta {inf.propuestaCodigo}
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
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No hay programaciones para este día.</div>
          )
        ) : (
          <div className="text-sm text-muted-foreground">Seleccioná un día en el calendario.</div>
        )}
      </div>
    </div>
  )
}
