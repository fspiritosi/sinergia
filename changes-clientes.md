# Refactor carpeta `/src/app/dashboard/clientes`

## Cambios realizados
- Normalicé los componentes de página a funciones con PascalCase y return con `;` para consistencia.
- Alineé imports con comillas dobles.

### Archivos
- `src/app/dashboard/clientes/page.tsx`
- `src/app/dashboard/clientes/locaciones/page.tsx`
- `src/app/dashboard/clientes/propuestas/page.tsx`

## Pendientes recomendados (siguientes fases)
- Evaluar necesidad real de `dynamic = "force-dynamic"`; mover data fetching a server component/server action para evitarlo si procede.
- Revisar componentes de dominio (`Clientes`, `ClientLocations`, `Propuestas`) para separar obtención de datos (server) y UI (client), y serializar tipos no serializables (p.ej. `Decimal`).
- Unificar estados de loading/empty/error con componentes comunes.
- Extraer hooks/utilidades compartidas para filtros/paginación si se repiten entre clientes/propuestas/locaciones.
- Crear barriles/exports por dominio para imports más limpios.

## Cambios adicionales aplicados (fase 2)
- Normalicé estilos de imports/comillas y returns con `;` en componentes server:
  - `src/components/clientes/Clientes.tsx`
  - `src/components/clientLocations/ClientsLocations.tsx`
  - `src/components/propuestas/Propuestas.tsx`

## Cambios adicionales aplicados (fase 3 - dynamic)
- Reemplazado `dynamic = "force-dynamic"` por `revalidate = 0` para datos siempre frescos:
  - `src/app/dashboard/clientes/page.tsx`
  - `src/app/dashboard/clientes/locaciones/page.tsx`
  - `src/app/dashboard/clientes/propuestas/page.tsx`

## Cambios adicionales aplicados (fase 4 - datos en server)
- Ordenamiento en base de datos en lugar de sort manual:
  - `src/components/clientes/components/actions.ts` (`orderBy is_active desc, name asc`)
  - `src/components/clientLocations/components/actions.ts` (`orderBy is_active desc, name asc`; `getActiveClientLocations` `orderBy name asc`)

## Cambios adicionales aplicados (fase 5 - estados de tablas)
- Componente compartido `TableState` para manejar loading/empty/error en tablas.
- Integrado en wrappers:
  - `src/components/clientes/components/clientes-table-wrapper.tsx`
  - `src/components/clientLocations/components/clientLocations-table-wrapper.tsx`
  - `src/components/propuestas/components/propuestas-table-wrapper.tsx`

## Cambios adicionales aplicados (fase 6 - búsqueda compartida)
- Utilidad `createStringSearchFilter` para búsquedas multi-campo en tablas:
  - `src/components/tables/search-utils.ts`
- Integración en tablas:
  - `src/components/clientes/components/clientes-table.tsx`
  - `src/components/clientLocations/components/clientLocations-table.tsx`
  - `src/components/propuestas/components/propuestas-table.tsx`

## Pendientes siguientes (sugeridos)
- Evaluar mover data fetching a server components/actions para evitar `dynamic = "force-dynamic"` donde no sea necesario.
- Revisar componentes de dominio para separar UI/estado (client) de datos (server) y serializar tipos no serializables.
- Unificar estados loading/empty/error con componentes comunes.
- Extraer hooks/utilidades compartidas para filtros/paginación si hay duplicación.
- Crear barriles/exports por dominio para imports más limpios y centralizar tipos.
