import type { PlanTrabajoProgramacionCalendarItem } from "@/components/planesTrabajo/components/actions"
import type { InformeCalendarItem } from "@/components/informes/components/actions"

// Tipo unificado para eventos del calendario
export type CalendarioEvento = 
  | {
      tipo: 'programacion'
      id: string
      fecha_programada: string
      precision: 'dia' | 'mes'
      cliente_nombre: string
      item_nombre: string
      propuesta_codigo: string
      client_location_nombre: string | null
      requiere_informe: boolean
      ejecutado: boolean
      plan_trabajo_id: string
      plan_trabajo_estado: string
      cliente_id: string
      item_id: string
    }
  | {
      tipo: 'informe'
      id: string
      fecha_programada: string // fechaVencimiento
      cliente_nombre: string
      tipo_informe_nombre: string
      propuesta_codigo: string
      estado: string
      adjunto: string | null
      cliente_id: string
      propuesta_id: string
      tipo_informe_id: string
    }

// Función para transformar los datos actuales al formato unificado
export function transformarEventos(
  programaciones: PlanTrabajoProgramacionCalendarItem[],
  informes: InformeCalendarItem[],
): CalendarioEvento[] {
  const eventos: CalendarioEvento[] = []
  
  // Transformar programaciones
  programaciones.forEach((p) => {
    const itemNombre = p.detalleVarianteNombre ? `${p.itemNombre} - ${p.detalleVarianteNombre}` : p.itemNombre

    eventos.push({
      tipo: 'programacion',
      id: p.id,
      fecha_programada: p.fechaProgramada,
      precision: p.precision,
      cliente_nombre: p.clienteNombre,
      item_nombre: itemNombre,
      propuesta_codigo: p.propuestaCodigo,
      client_location_nombre: p.clientLocationNombre,
      requiere_informe: p.requiereInforme,
      ejecutado: p.ejecutado,
      plan_trabajo_id: p.planTrabajoId,
      plan_trabajo_estado: p.planTrabajoEstado,
      cliente_id: p.clienteId,
      item_id: p.itemId,
    })
  })
  
  // Transformar informes
  informes.forEach(i => {
    eventos.push({
      tipo: 'informe',
      id: i.id,
      fecha_programada: i.fechaVencimiento,
      cliente_nombre: i.clienteNombre,
      tipo_informe_nombre: i.tipoDeInformeNombre,
      propuesta_codigo: i.propuestaCodigo,
      estado: i.estado,
      adjunto: i.adjunto,
      cliente_id: i.clienteId,
      propuesta_id: i.propuestaId,
      tipo_informe_id: i.tipoDeInformeId,
    })
  })
  
  return eventos
}

