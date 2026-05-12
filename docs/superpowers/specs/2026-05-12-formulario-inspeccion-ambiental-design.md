# Formulario de Inspección Ambiental — Spec

## Contexto

El sistema necesita un formulario digital para inspecciones ambientales que hoy se hacen en papel. El formulario contiene ~39 preguntas agrupadas en 4 secciones con sub-secciones, respuestas SI/NO/NA, acciones correctivas predefinidas (checkboxes) cuando la respuesta es NO, y preguntas condicionales que se habilitan según respuestas anteriores.

Debe ser accesible tanto desde el dashboard como desde una URL independiente optimizada para tablet. El formulario soporta autoguardado continuo para no perder progreso.

## Decisiones clave

| Tema                    | Decisión                                                                          |
| ----------------------- | --------------------------------------------------------------------------------- |
| Relación con Informes   | Híbrido: entidad independiente, vinculable opcionalmente a un Informe             |
| Preguntas               | Fijas por seed, no editables desde UI                                             |
| Tipos de inspección     | 2: Inspección de Base, Inspección de Equipo. Mismo set de preguntas               |
| Respuestas              | SI / NO / NA. Cuando NO → checkboxes predefinidos + observaciones                 |
| Preguntas condicionales | Sub-preguntas visibles solo si la padre fue SÍ                                    |
| Guardado                | Autoguardado continuo (upsert por pregunta, debounce 500ms en texto)              |
| PDF                     | No en MVP, solo UI                                                                |
| Permisos                | Todos los roles crean y llenan, lectura solo ve                                   |
| Lugar                   | Inspección de Base → dropdown ClientLocations; Inspección de Equipo → texto libre |

## Modelo de datos

### Tablas de catálogo (seed)

**SeccionInspeccion** — Secciones y sub-secciones del formulario.

| Campo    | Tipo            | Descripción                       |
| -------- | --------------- | --------------------------------- |
| id       | uuid PK         |                                   |
| codigo   | string unique   | "1", "1.1", "1.2", "2", "3", "4"  |
| titulo   | string          | "GESTIÓN DE RESIDUOS Y EFLUENTES" |
| parentId | uuid? FK → self | Sub-sección de otra sección       |
| orden    | int             | Orden de renderizado              |

**PreguntaInspeccion** — Cada pregunta del formulario.

| Campo              | Tipo                        | Descripción                         |
| ------------------ | --------------------------- | ----------------------------------- |
| id                 | uuid PK                     |                                     |
| codigo             | string unique               | "1.1.1", "1.2.1.1"                  |
| texto              | string                      | Texto de la pregunta                |
| seccionId          | uuid FK → SeccionInspeccion | A qué sección pertenece             |
| orden              | int                         | Orden dentro de la sección          |
| parentPreguntaId   | uuid? FK → self             | Pregunta padre (condicional)        |
| condicionRespuesta | string?                     | "si" → solo visible si padre fue SÍ |

**AccionCorrectivaInspeccion** — Opciones de acción correctiva por pregunta.

| Campo      | Tipo                         | Descripción             |
| ---------- | ---------------------------- | ----------------------- |
| id         | uuid PK                      |                         |
| preguntaId | uuid FK → PreguntaInspeccion |                         |
| texto      | string                       | Texto de la acción      |
| orden      | int                          | Orden de los checkboxes |

### Tablas operativas

**InspeccionFormulario** — Cabecera de cada inspección.

| Campo            | Tipo                                      | Descripción                 |
| ---------------- | ----------------------------------------- | --------------------------- |
| id               | uuid PK                                   |                             |
| clienteId        | uuid FK → Cliente                         |                             |
| tipo             | enum (inspeccion_base, inspeccion_equipo) |                             |
| fecha            | DateTime default(now())                   | Autocompletada              |
| estado           | enum (borrador, completada)               |                             |
| realizadoPorId   | uuid FK → User                            | Usuario RBAC que realiza    |
| clientLocationId | uuid? FK → ClientLocations                | Solo para inspeccion_base   |
| lugarTexto       | string?                                   | Solo para inspeccion_equipo |
| informeId        | uuid? unique FK → Informe                 | Vínculo opcional 1:1        |

**InspeccionRespuesta** — Una fila por pregunta respondida.

| Campo         | Tipo                           | Descripción       |
| ------------- | ------------------------------ | ----------------- |
| id            | uuid PK                        |                   |
| formularioId  | uuid FK → InspeccionFormulario | onDelete: Cascade |
| preguntaId    | uuid FK → PreguntaInspeccion   |                   |
| valor         | enum (si, no, na)              |                   |
| observaciones | string?                        |                   |

Constraint unique: `[formularioId, preguntaId]` — permite upsert para autoguardado.

**InspeccionAccionSeleccionada** — Acciones correctivas elegidas en respuestas NO.

| Campo       | Tipo                                 | Descripción       |
| ----------- | ------------------------------------ | ----------------- |
| respuestaId | uuid FK → InspeccionRespuesta        | onDelete: Cascade |
| accionId    | uuid FK → AccionCorrectivaInspeccion |                   |

PK compuesta: `[respuestaId, accionId]`.

## Rutas

### Dashboard

| Ruta                            | Propósito                                                              |
| ------------------------------- | ---------------------------------------------------------------------- |
| `/dashboard/inspecciones`       | Tabla paginada con filtros (estado, tipo, cliente, fecha)              |
| `/dashboard/inspecciones/nueva` | Crear inspección: elegir cliente, tipo, lugar → redirect al formulario |
| `/dashboard/inspecciones/[id]`  | Formulario (edición si borrador, solo lectura si completada)           |

### Tablet (layout minimalista, sin sidebar)

| Ruta               | Propósito                                                |
| ------------------ | -------------------------------------------------------- |
| `/inspeccion`      | Landing: borradores del usuario logueado + botón "Nueva" |
| `/inspeccion/[id]` | Formulario (mismo componente, layout diferente)          |

Protección: `/dashboard/inspecciones/*` por middleware route-guard. `/inspeccion/*` por Clerk auth solamente (sin route-guard por rol).

## Sidebar

Nueva entrada "Inspecciones" en el grupo "Planificación", con `requiredPermission: PERMISSIONS.INSPECCIONES_VIEW`.

## Permisos (agregar al seed RBAC)

| Código              | admin | gerente | tecnico | lectura |
| ------------------- | ----- | ------- | ------- | ------- |
| inspecciones:view   | ✓     | ✓       | ✓       | ✓       |
| inspecciones:create | ✓     | ✓       | ✓       | —       |
| inspecciones:update | ✓     | ✓       | ✓       | —       |
| inspecciones:delete | ✓     | —       | —       | —       |

Route-guard `/dashboard/inspecciones` → `[admin, gerente, tecnico, lectura]`.

## Flujo del formulario

### Crear inspección

1. Elegir cliente (dropdown), tipo (Inspección de Base / Equipo), lugar (dropdown ClientLocations o texto libre según tipo).
2. Se crea `InspeccionFormulario` con estado `borrador` y `realizadoPorId` del user.
3. Redirect al formulario.

### Llenar

- Preguntas agrupadas por sección (acordeón colapsable).
- Cada pregunta: código + texto + 3 botones toggle (SÍ/NO/NA).
- Si NO → expande checkboxes de acciones correctivas + observaciones.
- Si SÍ y tiene hijasCondicionales → muestra sub-preguntas.
- Observaciones siempre visible (colapsable, opcional).

### Autoguardado

- Cada cambio de respuesta (click SÍ/NO/NA, toggle checkbox, blur observaciones) → upsert `InspeccionRespuesta`.
- Si NO → sincronizar `InspeccionAccionSeleccionada` (delete + create).
- Si cambia de NO a SÍ/NA → borrar acciones seleccionadas.
- Debounce 500ms en observaciones.
- Indicador visual: "Guardado" / "Guardando..." / "Error".

### Finalizar

- Botón "Finalizar inspección" al final.
- Validación: todas las preguntas respondidas (excepto condicionales cuya padre ≠ SÍ).
- Si faltan → scroll a la primera + highlight.
- Si OK → estado = `completada`, formulario pasa a solo lectura.

### Vincular a Informe (opcional)

En la cabecera: dropdown de informes pendientes del mismo cliente. Guarda `informeId` en `InspeccionFormulario`.

## Vista de resultados

Tabla paginada en `/dashboard/inspecciones`:

- Columnas: Fecha, Cliente, Tipo, Lugar, Realizado por, Estado, Acciones.
- Filtros: estado, tipo, cliente.
- Click → formulario en modo lectura (completada) o edición (borrador).

Indicadores visuales en modo lectura:

- SÍ → verde
- NO → rojo + acciones correctivas marcadas
- NA → gris

## Componentes clave

- `<InspeccionForm>` — componente principal del formulario, compartido entre dashboard y tablet.
- `<InspeccionSeccion>` — acordeón por sección/sub-sección.
- `<InspeccionPregunta>` — renderiza una pregunta con sus toggles, acciones y observaciones.
- `<InspeccionCrear>` — formulario de cabecera (cliente, tipo, lugar).
- `<InspeccionesTable>` — tabla paginada del listado.

## Archivos nuevos estimados

### Prisma + seed

- `prisma/schema.prisma` — 6 modelos nuevos + 3 enums + relaciones en modelos existentes.
- `prisma/seed-inspecciones.ts` — seed de secciones, preguntas y acciones correctivas (~39 preguntas, ~120 acciones).

### Server-side

- `src/repositories/inspeccion.repository.ts`
- `src/dtos/inspeccion.dto.ts`
- `src/components/inspecciones/components/actions.ts` (lecturas)
- `src/components/inspecciones/components/inspeccion-actions.ts` (mutaciones con requirePermission)
- `src/lib/rbac/permissions.ts` — agregar INSPECCIONES\_\*
- `prisma/seed-rbac.ts` — agregar permisos de inspecciones al seed

### Páginas dashboard

- `src/app/dashboard/inspecciones/page.tsx`
- `src/app/dashboard/inspecciones/nueva/page.tsx`
- `src/app/dashboard/inspecciones/[id]/page.tsx`
- `src/app/dashboard/inspecciones/loading.tsx`
- `src/app/dashboard/inspecciones/error.tsx`

### Páginas tablet

- `src/app/inspeccion/layout.tsx` (layout minimalista)
- `src/app/inspeccion/page.tsx`
- `src/app/inspeccion/[id]/page.tsx`

### Componentes

- `src/components/inspecciones/Inspecciones.tsx`
- `src/components/inspecciones/components/inspecciones-table.tsx`
- `src/components/inspecciones/components/inspecciones-table-wrapper.tsx`
- `src/components/inspecciones/components/columns.tsx`
- `src/components/inspecciones/components/inspeccion-form.tsx`
- `src/components/inspecciones/components/inspeccion-crear.tsx`
- `src/components/inspecciones/components/inspeccion-seccion.tsx`
- `src/components/inspecciones/components/inspeccion-pregunta.tsx`

### Modificados

- `src/components/app-sidebar.tsx` — nueva entrada "Inspecciones"
- `src/lib/rbac/route-guards.ts` — agregar `/dashboard/inspecciones`
- `src/proxy.ts` — no requiere cambios (la ruta `/inspeccion` no necesita route-guard, solo Clerk auth)
