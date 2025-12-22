# Documentación Completa: Sistema de Calendario

Esta documentación describe en detalle la implementación del sistema de calendario para que pueda ser replicado en otros proyectos. El calendario soporta dos vistas: **Vista de Grid (mes)** y **Vista de Agenda**, con navegación por meses y localización en español.

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Dependencias Requeridas](#dependencias-requeridas)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Tipos de Datos](#tipos-de-datos)
5. [Componentes Detallados](#componentes-detallados)
6. [Implementación Completa](#implementación-completa)
7. [Uso e Integración](#uso-e-integración)
8. [Personalización](#personalización)
9. [Consideraciones Importantes](#consideraciones-importantes)

---

## 📝 Descripción General

El sistema de calendario está compuesto por:
- **CalendarioView**: Componente principal que gestiona la vista y navegación
- **CalendarioGrid**: Vista de calendario tipo grid (mes completo)
- **CalendarioAgenda**: Vista de agenda (lista ordenada por fecha)

### Características principales:
- ✅ Dos vistas: Grid (mes) y Agenda (lista)
- ✅ Navegación entre meses (anterior/siguiente)
- ✅ Botón "Hoy" para volver al mes actual
- ✅ Resaltado del día actual
- ✅ Soporte para múltiples eventos por día
- ✅ Localización en español (moment.js)
- ✅ Soporte de timezone (configurable)
- ✅ Responsive design

---

## 📦 Dependencias Requeridas

### Paquetes NPM

```json
{
  "dependencies": {
    "moment": "^2.30.1",
    "moment-timezone": "^0.6.0",
    "@types/moment": "^2.11.29",
    "lucide-react": "^0.511.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.0"
  }
}
```

### Componentes UI (shadcn/ui)

Necesitarás instalar los siguientes componentes de shadcn/ui:
- `card` - Para el contenedor principal
- `button` - Para los controles de navegación
- `badge` - Para mostrar contadores (opcional)

```bash
npx shadcn@latest add card button badge
```

---

## 📁 Estructura de Archivos

```
components/
  calendario/
    Calendario.tsx              # Componente principal (server component)
    components/
      calendario-view.tsx       # Vista principal con controles
      calendario-grid.tsx       # Vista de grid/mes
      calendario-agenda.tsx     # Vista de agenda/lista
```

---

## 🔷 Tipos de Datos

### Interface de Evento/Item del Calendario

El calendario espera un array de objetos con la siguiente estructura:

```typescript
interface CalendarioItem {
  id: string
  numero_inspeccion: string        // Identificador/número del evento
  cliente_nombre: string           // Nombre del cliente (o título)
  equipo: string                   // Equipo o subtítulo
  lugar: string                    // Ubicación
  responsable: string              // Responsable
  fecha_programada: string         // Fecha en formato YYYY-MM-DD
  estado?: string                  // Estado opcional
  [key: string]: any              // Otros campos adicionales
}

type CalendarioItems = CalendarioItem[]
```

### Tipo de Vista

```typescript
type VistaCalendario = 'calendario' | 'agenda'
```

---

## 🧩 Componentes Detallados

### 1. Calendario.tsx (Componente Principal - Server Component)

Este componente es el punto de entrada y puede ser un Server Component de Next.js que obtiene los datos.

```typescript
import React from 'react'
import { CalendarioView } from './components/calendario-view'

// Función para obtener los datos (adaptar según tu caso de uso)
async function getEventos() {
  // Aquí iría tu lógica para obtener los eventos
  // Ejemplo: consulta a base de datos, API, etc.
  return []
}

async function Calendario() {
  const eventos = await getEventos()

  return <CalendarioView eventos={eventos} />
}

export default Calendario
```

---

### 2. calendario-view.tsx (Componente Principal de Vista)

Este componente gestiona el estado, la navegación entre meses y el cambio de vista.

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react"
import { CalendarioGrid } from "./calendario-grid"
import { CalendarioAgenda } from "./calendario-agenda"
import moment from "moment"
import "moment/locale/es"

type VistaCalendario = 'calendario' | 'agenda'

interface CalendarioViewProps {
  eventos: Array<{
    id: string
    numero_inspeccion: string
    cliente_nombre: string
    equipo: string
    lugar: string
    responsable: string
    fecha_programada: string
    [key: string]: any
  }>
}

export function CalendarioView({ eventos }: CalendarioViewProps) {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [vista, setVista] = useState<VistaCalendario>('calendario')

  const fechaMoment = moment(fechaActual)
  const mesActual = fechaMoment.month()
  const añoActual = fechaMoment.year()

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

  // Filtrar eventos del mes actual
  const eventosDelMes = eventos.filter(evento => {
    const fechaEvento = moment(evento.fecha_programada)
    return fechaEvento.month() === mesActual &&
      fechaEvento.year() === añoActual
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendario de Eventos</CardTitle>
            <CardDescription>
              Vista mensual de los eventos programados
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
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
          <CalendarioGrid
            fecha={fechaActual}
            eventos={eventosDelMes}
          />
        ) : (
          <CalendarioAgenda
            fecha={fechaActual}
            eventos={eventosDelMes}
          />
        )}
      </CardContent>
    </Card>
  )
}
```

---

### 3. calendario-grid.tsx (Vista de Grid/Mes)

Este componente renderiza el calendario tipo grid con todos los días del mes.

```typescript
"use client"

import { cn } from "@/lib/utils"
import moment from "moment-timezone"
import "moment/locale/es"

// Configurar el timezone según tu región
const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires'
// O usar 'America/Mexico_City', 'America/Bogota', etc.

interface CalendarioGridProps {
  fecha: Date
  eventos: Array<{
    id: string
    numero_inspeccion: string
    cliente_nombre: string
    equipo: string
    lugar: string
    responsable: string
    fecha_programada: string
    [key: string]: any
  }>
}

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function CalendarioGrid({ fecha, eventos }: CalendarioGridProps) {
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
  const eventosPorFecha = eventos.reduce((acc, evento) => {
    const fechaKey = evento.fecha_programada
    if (!acc[fechaKey]) {
      acc[fechaKey] = []
    }
    acc[fechaKey].push(evento)
    return acc
  }, {} as Record<string, typeof eventos>)

  const hoy = moment.tz(TIMEZONE_ARGENTINA)
  const esHoy = (fecha: Date) => {
    return moment.tz(fecha, TIMEZONE_ARGENTINA).isSame(hoy, 'day')
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
          const eventosDelDia = eventosPorFecha[fechaKey] || []

          return (
            <div
              key={index}
              className={cn(
                "bg-background min-h-[120px] p-2 flex flex-col",
                !diaInfo.esDelMesActual && "bg-muted/50 text-muted-foreground",
                esHoy(diaInfo.fecha) && "bg-primary/5 ring-2 ring-primary/20"
              )}
            >
              {/* Número del día */}
              <div className={cn(
                "text-sm font-medium mb-1",
                esHoy(diaInfo.fecha) && "text-primary font-bold"
              )}>
                {diaInfo.dia}
              </div>

              {/* Eventos del día */}
              <div className="flex-1 space-y-1">
                {eventosDelDia.slice(0, 3).map((evento, idx: number) => (
                  <div
                    key={idx}
                    className="bg-muted after:bg-primary/70 relative rounded-md p-1 pl-3 text-xs after:absolute after:inset-y-1 after:left-1 after:w-0.5 after:rounded-full"
                    title={`${evento.numero_inspeccion} - ${evento.cliente_nombre} - ${evento.equipo}`}
                  >
                    <div className="font-medium truncate">
                      {evento.numero_inspeccion}
                    </div>
                    <div className="text-muted-foreground truncate">
                      {evento.cliente_nombre}
                    </div>
                  </div>
                ))}

                {/* Mostrar contador si hay más eventos */}
                {eventosDelDia.length > 3 && (
                  <div className="text-xs text-muted-foreground font-medium">
                    +{eventosDelDia.length - 3} más
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
```

---

### 4. calendario-agenda.tsx (Vista de Agenda/Lista)

Este componente muestra los eventos en formato de lista ordenada por fecha.

```typescript
"use client"

import { Badge } from "@/components/ui/badge"
import moment from "moment-timezone"
import "moment/locale/es"

const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires'

interface CalendarioAgendaProps {
  fecha: Date
  eventos: Array<{
    id: string
    numero_inspeccion: string
    cliente_nombre: string
    equipo: string
    lugar: string
    responsable: string
    fecha_programada: string
    [key: string]: any
  }>
}

export function CalendarioAgenda({ fecha, eventos }: CalendarioAgendaProps) {
  const fechaMoment = moment.tz(fecha, TIMEZONE_ARGENTINA)
  const año = fechaMoment.year()
  const mes = fechaMoment.month()

  // Agrupar eventos por fecha
  const eventosPorFecha = eventos.reduce((acc, evento) => {
    const fechaKey = evento.fecha_programada
    if (!acc[fechaKey]) {
      acc[fechaKey] = []
    }
    acc[fechaKey].push(evento)
    return acc
  }, {} as Record<string, typeof eventos>)

  // Obtener todas las fechas del mes que tienen eventos, ordenadas
  const fechasConEventos = Object.keys(eventosPorFecha)
    .filter(fechaKey => {
      const fechaEvento = moment.tz(fechaKey, TIMEZONE_ARGENTINA)
      return fechaEvento.month() === mes && fechaEvento.year() === año
    })
    .sort()

  if (fechasConEventos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay eventos programados para este mes</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {fechasConEventos.map(fechaKey => {
        const fecha = moment(fechaKey)
        const eventosDelDia = eventosPorFecha[fechaKey]

        return (
          <div key={fechaKey} className="space-y-3">
            {/* Header del día */}
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">
                {fecha.locale('es').format('dddd, D [de] MMMM')}
              </div>
              <div className="h-px bg-border flex-1"></div>
              <Badge variant="secondary">
                {eventosDelDia.length} {eventosDelDia.length === 1 ? 'evento' : 'eventos'}
              </Badge>
            </div>

            {/* Lista de eventos del día */}
            <div className="space-y-2 ml-4">
              {eventosDelDia.map((evento, idx) => (
                <div
                  key={idx}
                  className="bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
                >
                  <div className="font-medium">{evento.numero_inspeccion}</div>
                  <div className="text-muted-foreground text-xs">
                    {evento.cliente_nombre} - {evento.equipo}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {evento.lugar} • {evento.responsable}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

## 🔧 Utilidad: cn() para clases CSS

El componente `cn()` es una utilidad para combinar clases de Tailwind CSS. Si no la tienes, créala en `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 📖 Uso e Integración

### Ejemplo 1: Uso Básico

```typescript
// app/calendario/page.tsx
import Calendario from "@/components/calendario/Calendario"

export default function CalendarioPage() {
  return <Calendario />
}
```

### Ejemplo 2: Con Datos Personalizados

```typescript
// components/calendario/Calendario.tsx
import React from 'react'
import { CalendarioView } from './components/calendario-view'

async function Calendario() {
  // Aquí obtienes tus datos de cualquier fuente
  const eventos = [
    {
      id: '1',
      numero_inspeccion: 'INS-001',
      cliente_nombre: 'Cliente A',
      equipo: 'Equipo 1',
      lugar: 'Planta Principal',
      responsable: 'Juan Pérez',
      fecha_programada: '2024-12-15'
    },
    // ... más eventos
  ]

  return <CalendarioView eventos={eventos} />
}

export default Calendario
```

### Ejemplo 3: Con Fetch de API

```typescript
async function getEventos() {
  const res = await fetch('https://api.ejemplo.com/eventos')
  if (!res.ok) throw new Error('Error al obtener eventos')
  return res.json()
}
```

---

## 🎨 Personalización

### Cambiar el Timezone

Edita la constante `TIMEZONE_ARGENTINA` en `calendario-grid.tsx` y `calendario-agenda.tsx`:

```typescript
// Ejemplos de timezones comunes
const TIMEZONE = 'America/Mexico_City'      // México
const TIMEZONE = 'America/Bogota'           // Colombia
const TIMEZONE = 'America/Santiago'         // Chile
const TIMEZONE = 'America/Lima'             // Perú
const TIMEZONE = 'UTC'                      // UTC
```

### Cambiar los Campos Mostrados

Para personalizar qué campos se muestran, edita los componentes:

**En calendario-grid.tsx** (líneas ~129-135):
```typescript
<div className="font-medium truncate">
  {evento.numero_inspeccion}  {/* Cambia este campo */}
</div>
<div className="text-muted-foreground truncate">
  {evento.cliente_nombre}     {/* Cambia este campo */}
</div>
```

**En calendario-agenda.tsx** (líneas ~72-78):
```typescript
<div className="font-medium">{evento.numero_inspeccion}</div>
<div className="text-muted-foreground text-xs">
  {evento.cliente_nombre} - {evento.equipo}
</div>
<div className="text-muted-foreground text-xs">
  {evento.lugar} • {evento.responsable}
</div>
```

### Cambiar el Idioma

El calendario está configurado para español. Para cambiar el idioma:

1. Importa el locale correspondiente de moment:
```typescript
import "moment/locale/en"  // Para inglés
import "moment/locale/pt"  // Para portugués
```

2. Cambia el formato de fecha:
```typescript
// En lugar de:
fecha.locale('es').format('dddd, D [de] MMMM')

// Usa:
fecha.locale('en').format('dddd, MMMM D')  // Inglés
```

### Personalizar Colores y Estilos

Los componentes usan clases de Tailwind CSS. Puedes personalizar:

- **Día actual**: Clase `bg-primary/5 ring-2 ring-primary/20`
- **Días del mes anterior/siguiente**: Clase `bg-muted/50 text-muted-foreground`
- **Eventos**: Clase `bg-muted after:bg-primary/70`

Modifica estas clases según tu tema de diseño.

### Agregar Funcionalidad de Click en Eventos

Para hacer los eventos clicables, agrega un handler:

```typescript
// En calendario-grid.tsx
const handleEventoClick = (evento: CalendarioItem) => {
  // Tu lógica aquí: navegación, modal, etc.
  router.push(`/eventos/${evento.id}`)
}

// Luego en el div del evento:
<div
  onClick={() => handleEventoClick(evento)}
  className="bg-muted ... cursor-pointer hover:bg-muted/80"
  // ...
>
```

---

## ⚠️ Consideraciones Importantes

### 1. Formato de Fecha

Los eventos **deben** tener la fecha en formato `YYYY-MM-DD` (ISO 8601):
```typescript
fecha_programada: '2024-12-15'  // ✅ Correcto
fecha_programada: '15/12/2024'  // ❌ Incorrecto
fecha_programada: '2024-12-15T10:30:00'  // ✅ Funciona, se toma solo la fecha
```

### 2. Moment.js y Timezone

Asegúrate de tener `moment-timezone` instalado y configurado correctamente. Si no necesitas timezone específico, puedes simplificar usando solo `moment`:

```typescript
// En lugar de:
moment.tz(fecha, TIMEZONE_ARGENTINA)

// Usa:
moment(fecha)
```

### 3. Componentes UI Requeridos

Asegúrate de tener instalados los componentes de shadcn/ui:
- `card` - Contenedor principal
- `button` - Controles de navegación
- `badge` - Contador de eventos (solo en agenda)

### 4. Performance

Para grandes cantidades de eventos, considera:
- Paginación o filtrado
- Lazy loading
- Memoización con `useMemo` en cálculos pesados

### 5. Responsive Design

El grid está optimizado para pantallas grandes. Para móviles, considera:
- Mostrar solo la vista de agenda en móviles
- Ajustar el `min-h-[120px]` del grid
- Usar media queries para ocultar algunos controles

---

## 📚 Resumen de Archivos a Crear

1. `components/calendario/Calendario.tsx`
2. `components/calendario/components/calendario-view.tsx`
3. `components/calendario/components/calendario-grid.tsx`
4. `components/calendario/components/calendario-agenda.tsx`
5. `lib/utils.ts` (si no existe, para la función `cn()`)

---

## 🔄 Migración desde el Código Original

Si estás migrando desde el código de inspecciones:

1. **Renombrar props**: Cambia `inspecciones` por `eventos`
2. **Adaptar campos**: Ajusta los nombres de campos según tu modelo de datos
3. **Eliminar dependencias específicas**: Si no usas `getInspeccionesType`, crea tu propia interface
4. **Configurar timezone**: Ajusta `TIMEZONE_ARGENTINA` a tu región

---

## 📝 Ejemplo Completo de Integración

```typescript
// app/calendario/page.tsx
import Calendario from "@/components/calendario/Calendario"

export default function CalendarioPage() {
  return (
    <div className="container mx-auto py-6">
      <Calendario />
    </div>
  )
}
```

```typescript
// components/calendario/Calendario.tsx
import React from 'react'
import { CalendarioView } from './components/calendario-view'

// Tu función para obtener eventos
async function obtenerEventos() {
  // Tu lógica aquí
  return []
}

async function Calendario() {
  const eventos = await obtenerEventos()
  return <CalendarioView eventos={eventos} />
}

export default Calendario
```

---

¡Con esta documentación deberías poder replicar el sistema de calendario en cualquier proyecto! 🎉

