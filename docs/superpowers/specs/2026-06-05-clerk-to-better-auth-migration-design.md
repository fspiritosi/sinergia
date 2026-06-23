# Diseño: Migración de Clerk a better-auth (Sinergia)

- **Fecha:** 2026-06-05
- **Ticket:** #155 — "Revisar roles y permisos" (frente de autenticación)
- **Autor:** Fabricio + Claude
- **Estado:** Propuesta de diseño (pendiente de revisión)

## 1. Contexto y objetivo

El ticket #155 pide dos cosas:

1. Los roles y permisos "no funcionan de la manera correcta" (usuarios ven cosas que no deberían).
2. Salir de Clerk y migrar la autenticación a **better-auth**.

Este spec cubre **solo el frente 2 (migración de auth)**. El frente 1 (gateo de permisos en la UI) se trata en un spec aparte porque es un problema de _enforcement_ independiente del proveedor de identidad (ver §9).

**Objetivo:** Reemplazar Clerk por better-auth como proveedor de identidad/sesión, **conservando intacto el sistema RBAC propio** (tablas `Role`/`Permission`/`RolePermission` editables por UI), con login por **email+contraseña** y alta de usuarios por **invitación/email**.

## 2. Estado actual (resumen)

- **Auth:** Clerk (`@clerk/nextjs` v6) — `ClerkProvider`, `clerkMiddleware` en `src/proxy.ts`, `auth()`/`clerkClient()` en `src/lib/auth.ts`, webhook de sincronización en `src/app/api/webhooks/clerk/route.ts`, invitaciones vía `clerkClient.invitations`.
- **RBAC (propio, DB-driven):** modelos `User`/`Role`/`Permission`/`RolePermission`; `requirePermission`/`requireRole`/`hasPermission` (server) y `PermissionsProvider`/`usePermissions`/`<Can>` (cliente). Los permisos del usuario se cargan desde la DB (`role.permissions`).
- **Vínculo Clerk↔DB:** `User.clerkId`. El rol se propaga vía `publicMetadata.role` en Clerk + webhook.
- **Next.js 16:** el middleware se llama `proxy.ts` (renombre oficial de Next 16, runtime nodejs). Está activo.

### Bugs de sincronización detectados (que la migración elimina)

- Rol desincronizado entre `publicMetadata` de Clerk y la DB (al cambiar rol en DB no se refleja hasta un `user.updated`).
- `DEFAULT_ROLE_NAME` duplicado en `auth.ts` y en el webhook.
- Dependencia de "customize session token" en el dashboard de Clerk para que el rol llegue al middleware.
- Posible race condition entre el bootstrap on-demand (`getCurrentDbUser`) y el webhook `user.created`.

## 3. Alcance

**Incluido:**

- better-auth para autenticación (email+contraseña) y alta por invitación/email.
- Reescritura de: helper de sesión server, middleware (`proxy.ts`), página de sign-in, menú de usuario, alta/invitación de usuarios.
- Migración de esquema (tablas de better-auth + ajuste de `User`).
- Envío de emails (invitación / reseteo de contraseña) vía **SMTP propio con Nodemailer**.
- Remoción completa de Clerk (deps, env, provider, webhook).

**Excluido (spec aparte):**

- Auditoría/completado del gateo `<Can>` de acciones en la UI (frente 1 del ticket).
- Social login, magic link, OTP (no requeridos).
- Migración de contraseñas desde Clerk (no las exporta; con <10 usuarios se re-setean por email).

## 4. Decisiones tomadas

| Tema                  | Decisión                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| Modelo RBAC           | Se conserva el DB-driven actual; better-auth solo hace identidad/sesión  |
| Métodos de login      | Email+contraseña e invitación por email                                  |
| Usuarios a migrar     | Pocos (<10) → re-set de contraseña por email, sin migrar hashes          |
| Email                 | SMTP propio con Nodemailer                                               |
| Autorización de rutas | Se mueve del middleware a un guard server-side en `dashboard/layout.tsx` |

## 5. Diseño técnico

### 5.1 Modelo de datos

better-auth (Prisma adapter, mismo Postgres) administra:

- `user` — **reusamos la tabla `User` existente** (preserva `id` y FKs como `InspeccionFormulario.realizadoPorId`).
  - Se **elimina** `clerkId`.
  - Se **agregan** los campos de better-auth: `emailVerified Boolean`, `image String?`.
  - Se **conservan** como `additionalFields`: `roleId String`, `isActive Boolean @default(true)`.
- `session`, `account`, `verification` — tablas nuevas administradas por better-auth.
  - La **contraseña** (hash) vive en `account` (provider `credential`), no en `user`.

`Role`/`Permission`/`RolePermission` **sin cambios**.

### 5.2 Auth del servidor (`src/lib/auth.ts`)

```ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, sendResetPassword: async ({ user, url }) => sendMail(...) },
  emailVerification: { sendVerificationEmail: async ({ user, url }) => sendMail(...) },
  user: { additionalFields: { roleId: { type: "string" }, isActive: { type: "boolean", defaultValue: true } } },
  plugins: [ /* admin plugin opcional para createUser server-side */ ],
});
```

- Handler en `src/app/api/auth/[...all]/route.ts` (`toNextJsHandler(auth)`).
- `getCurrentDbUser()` reescrito: `auth.api.getSession({ headers })` → `session.user.id` → carga el usuario con `role.permissions` desde la DB (mantiene `cache()` de React).
- `getCurrentUserPermissions()` **no cambia** (sigue leyendo `role.permissions`).
- Centralizar `DEFAULT_ROLE_NAME`/`ADMIN_ROLE_NAME` en un único módulo.

### 5.3 Middleware (`src/proxy.ts`)

- Reemplazar `clerkMiddleware` por check de sesión de better-auth (cookie liviana, `getSessionCookie`) → redirigir a `/sign-in` si no hay sesión en rutas protegidas. Rutas públicas: `/`, `/sign-in`, `/api/auth/*`.
- **Autorización por rol/permiso** se mueve a un guard **server-side** en `src/app/dashboard/layout.tsx` (ya carga permisos): si el rol del usuario no cumple `ROUTE_GUARDS` para la ruta, redirige/forbidden. Esto elimina la dependencia del token de Clerk y centraliza la decisión donde hay acceso a la DB.

### 5.4 Cliente / UI

- Eliminar `<ClerkProvider>` del root layout.
- `src/lib/auth-client.ts`: `createAuthClient()` → `authClient.signIn.email`, `authClient.signOut`, `authClient.useSession`.
- **Página de sign-in propia** (`/sign-in`) con form email+contraseña + link "olvidé mi contraseña".
- Reemplazos:
  - `<UserButton>` (sidebar) → dropdown propio (nombre + cerrar sesión).
  - `<SignedIn>/<SignedOut>` (landing header) → condicional con `authClient.useSession`.
  - `useUser` → `authClient.useSession`.

### 5.5 Invitaciones / alta de usuarios

- Reemplazar `createUserAction` (que usa `clerkClient.invitations`) por:
  - Crear el `User` (email + `roleId`) en la DB / vía better-auth admin `createUser`.
  - Disparar email de "seteá tu contraseña" (flujo password-reset/verification) vía Nodemailer.
- Eliminar `src/app/api/webhooks/clerk/route.ts` por completo.

### 5.6 Envío de email (Nodemailer + SMTP)

- Nuevo módulo `src/lib/mailer.ts` con un transport SMTP configurado por env (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), validadas en `src/lib/env.ts`.
- Usado por better-auth para `sendResetPassword` y `sendVerificationEmail`.

## 6. Plan de cutover

1. Agregar deps (`better-auth`, `nodemailer`) y env (SMTP + `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
2. Migración Prisma: crear `session`/`account`/`verification`; ajustar `User` (quitar `clerkId`, agregar `emailVerified`/`image`).
3. Implementar auth server, mailer, handler, auth-client, sign-in page, guards.
4. Reescribir alta de usuarios; eliminar webhook.
5. Re-invitar a los <10 usuarios (conservan `id` y `roleId`; setean contraseña por email).
6. Quitar Clerk (deps, env, provider, componentes).
7. Deploy único. Rollback = revert del commit/deploy.

## 7. Riesgos y mitigaciones

| Riesgo                                                         | Mitigación                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Romper FKs a `User.id` al migrar                               | Reusar la tabla `User` (no recrear); preservar ids                                    |
| Usuarios sin poder entrar tras el cutover                      | Email de set-password listo y probado antes; con <10 usuarios, set manual de respaldo |
| SMTP mal configurado → no llegan mails                         | Probar el transport en dev antes del cutover; fallback de contraseña temporal manual  |
| `proxy` corre en runtime nodejs (Next 16)                      | better-auth soporta nodejs; el check de cookie no requiere edge                       |
| Pérdida de autorización por mover guard de middleware a layout | Tests manuales por rol en cada grupo de rutas                                         |

## 8. Testing

- **Unit:** conservar tests de guardias RBAC; agregar test de `getCurrentDbUser` con sesión mockeada.
- **Manual:** login OK/!OK, redirect sin sesión, ruta gateada por rol (admin vs no-admin), alta de usuario + email de set-password, logout.

## 9. Relación con el frente 1 (RBAC enforcement) — fuera de alcance

El síntoma "ven cosas que no deberían" es, sobre todo, **visibilidad de controles no gateados**: las guardas de ruta son por rol y los botones de acción (editar/eliminar/marcar) no siempre están envueltos en `<Can>`. Los **datos están protegidos** porque cada server action valida con `requirePermission`. Esto se resuelve en un spec aparte: auditar la UI y envolver acciones con `<Can>` según el permiso fino, y evaluar mover `ROUTE_GUARDS` de rol → permiso.

## 10. Preguntas abiertas

- ¿Confirmar credenciales SMTP disponibles (host/puerto/usuario) para dev y prod?
- ¿`BETTER_AUTH_URL` por entorno (dev/prod) ya definido?
