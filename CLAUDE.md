# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a business management application built with Next.js 16 (App Router) for managing clients, services, proposals, work plans, and reports. The system handles technical proposals ("propuestas técnicas"), work plan scheduling ("planes de trabajo"), and report generation ("informes").

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Environment Variables**: @t3-oss/env-nextjs (type-safe env vars with Zod validation)
- **Logging**: Pino (structured logging with context)
- **Data Fetching**: TanStack Query (React Query) for client-side caching
- **File Storage**: Cloudflare R2 (S3-compatible)
- **PDF Generation**: @react-pdf/renderer
- **Icons**: Lucide React
- **Date Handling**: date-fns, moment, moment-timezone

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database operations (Prisma)
npx prisma studio              # Open Prisma Studio GUI
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma generate           # Regenerate Prisma Client
```

**Important**: The `postinstall` script automatically runs `prisma generate && prisma migrate deploy` after `npm install`.

## Architecture

### Directory Structure

- `/src/app/` - Next.js App Router pages and API routes
  - `/dashboard/` - Protected dashboard routes (requires auth)
  - `/api/` - API route handlers
- `/src/components/` - React components organized by feature
  - `/ui/` - shadcn/ui base components
  - Feature-specific folders (e.g., `/clientes/`, `/propuestas/`, `/planificacion/`)
- `/src/lib/` - Utility functions and configurations
  - `env.ts` - Type-safe environment variables (use ONLY this for env vars)
  - `db.ts` - Prisma client instance
  - `logger.ts` - Pino logger configuration (use ONLY this for logging)
  - `r2-upload.ts` - File upload to Cloudflare R2
  - `pdf-constants.ts` - PDF generation constants
  - `dates.ts` - Date manipulation utilities
- `/src/app/` - Next.js App Router
  - `providers.tsx` - React Query provider (client component)
- `/src/generated/` - Prisma generated client (DO NOT EDIT)
- `/prisma/` - Database schema and migrations
  - `schema.prisma` - Database schema definition

### Authentication & Authorization

- Uses Clerk for authentication
- Protected routes are wrapped in dashboard layout at [/src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx)
- Middleware in [/src/proxy.ts](src/proxy.ts) handles route protection
- Public routes: `/`, `/sign-in`, `/sign-up`
- All `/dashboard/*` routes require authentication

### Database Schema Overview

The application manages a complex workflow from proposals to work plans to reports:

**Core Entities:**
- `Cliente` - Clients with locations (provincia/ciudad)
- `ClientLocations` - Multiple locations per client
- `Servicio` - Services (monthly or unitary)
- `Items` - Work items that can be planned and have variants
- `PropuestaTecnica` - Technical proposals linking clients and services
- `PlanTrabajo` - Work plans derived from approved proposals
- `PlanTrabajoProgramacion` - Individual scheduled tasks within work plans
- `Informe` - Reports generated from executed work plan tasks

**Supporting Entities:**
- `TipoDeInforme` - Report types
- `TipoDeVariante` - Variant types for items
- `DetalleVariante` - Specific variant details
- `Provincia` / `Ciudad` - Geographic data

**Key Relationships:**
- A `PropuestaTecnica` belongs to one `Cliente` and one `Servicio`
- A `PlanTrabajo` is created from an approved `PropuestaTecnica`
- A `PlanTrabajo` contains multiple `PlanTrabajoProgramacion` entries
- Each `PlanTrabajoProgramacion` can generate an `Informe`
- `Items` can have variants (`TipoDeVariante` + `DetalleVariante`)

**Important Enums:**
- `PropuestaStatus`: pendiente, aprobada, rechazada, en_progreso, finalizada
- `PlanTrabajoEstado`: pendiente_programacion, programado_incompleto, programado_completo, en_desarrollo, finalizado_con_pendientes, finalizado_completo
- `InformeEstado`: pendiente, entregado
- `ProgramacionPrecision`: mes, dia

**Performance Optimization:**
The database schema includes **49 strategic indices** for query optimization:
- Foreign key indices for all relationships
- Status/state field indices (`is_active`, `status`, `estado`)
- Common filter fields (`name`, `createdAt`, `fechaProgramada`)
- Date range query fields (`fechaInicio`, `fechaFin`, `vigencia`)
- Composite indices for common query patterns

These indices significantly improve query performance for:
- Filtering by status/active records
- Sorting by name or date
- Foreign key lookups (joins)
- Date range queries

**Note**: The indices were added in migration `20260217122829_add_performance_indexes`

### File Upload Pattern

Files are stored in Cloudflare R2 (S3-compatible storage):

1. Use server actions that call `uploadFileToR2()` or `uploadBytesToR2()` from [/src/lib/r2-upload.ts](src/lib/r2-upload.ts)
2. Store the R2 key or URL in the database
3. Serve files via API routes (e.g., `/api/informes/file/[id]/route.ts`)

**Note**: R2 credentials are automatically validated at build time via `@/lib/env`. No manual validation needed in your code.

### PDF Generation

Uses `@react-pdf/renderer` for generating PDFs:
- PDF constants and styles defined in [/src/lib/pdf-constants.ts](src/lib/pdf-constants.ts)
- Generate PDFs on the server and upload to R2
- Example usage in informes and planes-trabajo features

### Component Patterns

- **UI Components**: Located in `/src/components/ui/`, based on shadcn/ui with Radix UI primitives
- **Feature Components**: Organized by domain (clientes, propuestas, planificacion, etc.)
- **Tables**: Use TanStack Table (@tanstack/react-table) - see `/src/components/tables/`
- **Forms**: Use React Hook Form with Zod schemas for validation
- **Server Actions**: Marked with `"use server"` directive, typically in lib files or component files
- **Error Handling**: Each route has `error.tsx` for error boundaries and `loading.tsx` for loading states
- **Loading States**: Use Skeleton components from shadcn/ui for consistent loading UX

### Path Aliases

TypeScript path alias `@/*` maps to `./src/*` (configured in tsconfig.json)

## Important Patterns

### Environment Variables Access

**CRITICAL RULE**: NEVER use `process.env` directly. Always import from `@/lib/env`:

```typescript
// ❌ WRONG - Will not have type-safety or validation
const bucket = process.env.CLOUDFLARE_R2_BUCKET

// ✅ CORRECT - Type-safe and validated
import { env } from "@/lib/env"
const bucket = env.CLOUDFLARE_R2_BUCKET
```

This ensures:
- TypeScript autocomplete
- Build-time validation (build fails if vars are missing)
- Runtime type checking with Zod
- No typos in variable names

### Database Access

Always use the Prisma client from `@/lib/db`:

```typescript
import prisma from "@/lib/db"

const clientes = await prisma.cliente.findMany()
```

Prisma client is generated to `/src/generated/` instead of `node_modules/.prisma/client` (see prisma.config.ts)

### Logging with Pino

**CRITICAL RULE**: NEVER use `console.log/error/warn` directly. Always import from `@/lib/logger`:

```typescript
// ❌ WRONG - Will not have structured logging
console.log("Cliente creado:", cliente)
console.error("Error:", error)

// ✅ CORRECT - Structured logging with context
import { dbLogger } from "@/lib/logger"
dbLogger.info({ cliente }, "Cliente creado")
dbLogger.error({ error, clienteId }, "Error al crear cliente")
```

**Available loggers:**
- `logger` - General purpose logger
- `dbLogger` - Database operations (use in *-actions.ts files)
- `authLogger` - Authentication operations
- `pdfLogger` - PDF generation operations
- `apiLogger` - API route handlers
- `uploadLogger` - File upload operations

**Log levels:**
- `logger.debug()` - Debugging information (only in development)
- `logger.info()` - Normal operations
- `logger.warn()` - Warning conditions
- `logger.error()` - Error conditions

**Best practices:**
- Always include relevant context (IDs, names, etc.) as the first parameter (object)
- Use descriptive messages as the second parameter (string)
- Never log sensitive data (passwords, tokens, etc.)
- Use the appropriate logger for the module/feature

**Example patterns:**
```typescript
// Database operations
import { dbLogger } from "@/lib/logger"
dbLogger.info({ clienteId, name: data.name }, "Cliente creado exitosamente")
dbLogger.error({ error, clienteId }, "Error al actualizar cliente")

// API routes
import { apiLogger } from "@/lib/logger"
apiLogger.info({ userId, method: request.method }, "API request received")
apiLogger.error({ error, path: request.url }, "API request failed")

// PDF generation
import { pdfLogger } from "@/lib/logger"
pdfLogger.info({ propuestaId }, "Generando PDF de propuesta")
pdfLogger.error({ error, propuestaId }, "Error al generar PDF")
```

This ensures:
- Structured logging with searchable context
- Automatic timestamps and log levels
- Pretty printing in development
- Production-ready JSON logging
- Performance tracking capabilities

### Error Boundaries and Loading States

The application implements Next.js error boundaries and loading states for better UX:

**Error Boundaries (`error.tsx`):**
- Must be client components (`"use client"`)
- Automatically catch errors in the route segment and children
- Display user-friendly error messages
- Provide recovery actions (retry, navigate back)
- Located at route level (e.g., `/dashboard/error.tsx`)

```typescript
// error.tsx pattern
"use client"

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error:", error) // Client-side logging only
  }, [error])

  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Loading States (`loading.tsx`):**
- Automatically shown while route segment is loading
- Use Skeleton components from shadcn/ui
- Should match the layout structure of the actual page
- Located at route level (e.g., `/dashboard/loading.tsx`, `/dashboard/clientes/loading.tsx`)

```typescript
// loading.tsx pattern
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
```

**Best practices:**
- Create specific loading states for each major route
- Match skeleton structure to actual page layout
- Keep error messages user-friendly and actionable
- Provide clear recovery options (retry, navigate)
- **Important**: Cannot use Pino logger in error.tsx (client component) - use console.error

### Data Fetching with React Query

The application uses **TanStack Query (React Query)** for client-side data fetching and caching:

**Setup:**
- QueryClient configured in [/src/app/providers.tsx](src/app/providers.tsx)
- Wrapped in root layout for global access
- Default staleTime: 60 seconds
- Disabled refetch on window focus

**Pattern for data fetching components:**
```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { getClientes } from "./components/actions"
import { Skeleton } from "@/components/ui/skeleton"

function Clientes() {
  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error: {error.message}
      </div>
    )
  }

  return <TableWrapper data={clientes || []} />
}
```

**Query Keys:**
Standard query keys used in the application:
- `["clientes"]` - All clients
- `["propuestas"]` - All proposals
- `["planes-trabajo"]` - All work plans
- `["items"]` - All items
- `["servicios"]` - All services
- `["usuarios"]` - All users
- `["informes"]` - All reports
- `["tipos-informe"]` - All report types
- `["tipos-variante"]` - All variant types
- `["detalles-variante"]` - All variant details
- `["client-locations"]` - All client locations

**Benefits:**
- Automatic caching with configurable stale time
- Automatic background refetching
- Optimistic updates support
- Request deduplication
- Built-in loading and error states
- DevTools for debugging (development only)

**Best practices:**
- Always handle loading and error states
- Use descriptive query keys
- Provide fallback empty arrays for data
- Keep server actions in separate files (actions.ts)
- Use mutations for data updates (create, update, delete)

### Server Actions

Server actions should be marked with `"use server"` and handle errors appropriately. They are commonly used for form submissions and data mutations.

### Date Handling

- The application uses multiple date libraries (date-fns, moment, moment-timezone)
- Check `/src/lib/dates.ts` for utility functions
- Database stores dates as `DateTime` (PostgreSQL timestamp)

### React Compiler

The project uses the React 19 compiler (`reactCompiler: true` in next.config.ts with babel-plugin-react-compiler)

## Environment Variables

### Type-Safe Environment Variables with @t3-oss/env-nextjs

This project uses `@t3-oss/env-nextjs` for runtime validation and type-safety of environment variables.

**CRITICAL**: Always import from `@/lib/env`, NEVER use `process.env` directly:

```typescript
// ❌ NEVER DO THIS
const apiKey = process.env.CLOUDFLARE_ACCESS_KEY_ID

// ✅ ALWAYS DO THIS
import { env } from "@/lib/env"
const apiKey = env.CLOUDFLARE_ACCESS_KEY_ID
```

**Benefits:**
- Build fails if required variables are missing
- TypeScript autocomplete for all env vars
- Runtime validation with Zod
- Clear distinction between server and client variables

**Configuration:** All environment variables are defined and validated in [/src/lib/env.ts](src/lib/env.ts)

**Required environment variables** (see .env.example):

**Server-only:**
- `DATABASE_URL` - PostgreSQL connection string (must be valid URL)
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLOUDFLARE_S3_API` - Cloudflare R2 endpoint URL
- `CLOUDFLARE_ACCESS_KEY_ID` - R2 access key
- `CLOUDFLARE_SECRET_ACCESS_KEY` - R2 secret key
- `CLOUDFLARE_R2_BUCKET` - R2 bucket name

**Client-exposed (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `NEXT_PUBLIC_APP_URL` - Application base URL
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Sign in route (default: "/sign-in")
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Sign up route (default: "/sign-up")
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - Post-login redirect (default: "/dashboard")
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - Post-signup redirect (default: "/dashboard")

**Adding new environment variables:**
1. Add to the appropriate section in `/src/lib/env.ts` (server or client)
2. Add Zod validation schema
3. Add to `runtimeEnv` mapping
4. Update `.env.example` with placeholder value

## Notes

- The generated Prisma client is in `/src/generated/` not the default location
- Import from `@/generated/client` when using Prisma types
- The app uses Spanish naming conventions for domain models and UI
- All dashboard routes are protected via Clerk middleware
- Error boundaries (`error.tsx`) and loading states (`loading.tsx`) are implemented at route level
- Database includes 49 performance indices for optimized queries (migration: `add_performance_indexes`)
- Pino logger is configured as server-only package in `next.config.ts`
- React Query is configured globally in `/src/app/providers.tsx` with 60s staleTime
- All main CRUD pages use React Query for data fetching (11 components migrated)
