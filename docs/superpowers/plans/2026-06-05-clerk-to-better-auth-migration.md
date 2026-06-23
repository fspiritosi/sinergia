# Clerk → better-auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk with better-auth as the identity/session provider for Sinergia, keeping the existing DB-driven RBAC intact.

**Architecture:** better-auth runs in-app via its Prisma adapter on the same Postgres DB, providing email+password auth and an invitation/set-password flow over SMTP (Nodemailer). The existing `Role`/`Permission`/`RolePermission` tables and `requirePermission`/`usePermissions` are preserved; the `User` table is reused (Clerk's `clerkId` removed, better-auth columns added). Route authorization moves from the middleware (`proxy.ts`) to a server-side guard in the dashboard layout.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts` middleware, nodejs runtime), Prisma + Postgres, better-auth `^1.x`, Nodemailer, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-05-clerk-to-better-auth-migration-design.md`

> **IMPORTANT — verify the library API first:** before Phase 2, run `npx ctx7@latest docs /better-auth/better-auth "<task topic>"` to confirm the exact API for the installed better-auth version (function names like `prismaAdapter`, `toNextJsHandler`, `getSessionCookie`, `auth.api.getSession`, admin plugin `createUser`). Pin the version in `package.json`. The code below follows better-auth v1.x documented patterns.

> **Branch:** do all work on a feature branch `feat/better-auth-migration` off `dev`. Do NOT commit on `dev` directly.

---

## File Structure

**Created:**

- `src/lib/auth-server.ts` — better-auth server instance (replaces Clerk config in `auth.ts`)
- `src/lib/auth-client.ts` — better-auth React client
- `src/lib/mailer.ts` — Nodemailer SMTP transport + `sendMail` helper
- `src/lib/__tests__/mailer.test.ts` — mailer unit test
- `src/app/api/auth/[...all]/route.ts` — better-auth Next.js route handler
- `src/app/(auth)/sign-in/page.tsx` — custom email+password sign-in page (replaces Clerk `<SignIn>`)
- `src/app/(auth)/set-password/page.tsx` — set/reset password page (invitation flow)
- `src/components/auth/user-menu.tsx` — user dropdown with logout (replaces `<UserButton>`)
- `src/lib/rbac/authorize-route.ts` — server-side route authorization helper (moved from middleware)

**Modified:**

- `prisma/schema.prisma` — add `Session`/`Account`/`Verification`; adjust `User` (drop `clerkId`, add `emailVerified`/`image`)
- `src/lib/auth.ts` — rewrite `getCurrentDbUser`/`getCurrentUserPermissions` to use better-auth session
- `src/lib/env.ts` — add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SMTP_*`; remove Clerk vars
- `src/proxy.ts` — replace `clerkMiddleware` with better-auth cookie check
- `src/app/dashboard/layout.tsx` — add server-side route authorization
- `src/app/layout.tsx` — remove `<ClerkProvider>` and Clerk header components
- `src/components/app-sidebar.tsx` — replace `useUser`/`<UserButton>` with better-auth
- `src/components/landing/header.tsx` — replace `<SignedIn>/<SignedOut>` with `useSession`
- `src/components/usuarios/components/actions.ts` — rewrite user creation to better-auth (no `clerkClient`)
- `package.json` — add `better-auth`, `nodemailer`; remove `@clerk/*`, `svix`

**Deleted:**

- `src/app/api/webhooks/clerk/route.ts`
- `src/app/sign-in/[[...sign-in]]/page.tsx` (Clerk catch-all)

---

## Phase 0 — Branch & dependencies

### Task 0: Create branch and install dependencies

**Files:** `package.json`

- [ ] **Step 1: Create the feature branch**

Run: `git checkout dev && git checkout -b feat/better-auth-migration`

- [ ] **Step 2: Install better-auth and nodemailer**

Run: `npm install better-auth nodemailer && npm install -D @types/nodemailer`
Expected: packages added to `package.json` dependencies.

- [ ] **Step 3: Generate a better-auth secret**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
Copy the output for `BETTER_AUTH_SECRET` in `.env` (do NOT commit `.env`).

- [ ] **Step 4: Commit the dependency changes**

```bash
git add package.json package-lock.json
git commit -m "build(auth): add better-auth and nodemailer deps"
```

---

## Phase 1 — Environment variables

### Task 1: Add better-auth + SMTP env vars (keep Clerk vars for now)

**Files:** Modify `src/lib/env.ts`, `.env.example`

- [ ] **Step 1: Add the new server vars to the Zod schema in `src/lib/env.ts`**

In the `server` object add:

```ts
BETTER_AUTH_SECRET: z.string().min(1),
BETTER_AUTH_URL: z.string().url(),
SMTP_HOST: z.string().min(1),
SMTP_PORT: z.coerce.number().int().positive(),
SMTP_USER: z.string().min(1),
SMTP_PASS: z.string().min(1),
SMTP_FROM: z.string().email(),
```

And add each to the `runtimeEnv` mapping:

```ts
BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
SMTP_HOST: process.env.SMTP_HOST,
SMTP_PORT: process.env.SMTP_PORT,
SMTP_USER: process.env.SMTP_USER,
SMTP_PASS: process.env.SMTP_PASS,
SMTP_FROM: process.env.SMTP_FROM,
```

- [ ] **Step 2: Update `.env.example` and your local `.env`**

Add placeholders to `.env.example`:

```
BETTER_AUTH_SECRET="<32-byte hex>"
BETTER_AUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="<smtp-password>"
SMTP_FROM="no-reply@example.com"
```

Fill real values in `.env` (dev SMTP credentials).

- [ ] **Step 3: Verify the app still typechecks**

Run: `npx tsc --noEmit`
Expected: 0 errors (Clerk vars still present).

- [ ] **Step 4: Commit**

```bash
git add src/lib/env.ts .env.example
git commit -m "build(auth): add better-auth and SMTP env vars"
```

---

## Phase 2 — Database schema

### Task 2: Add better-auth tables and adjust `User`

**Files:** Modify `prisma/schema.prisma`

> Verify field names/types against better-auth's Prisma schema for the installed version: `npx ctx7@latest docs /better-auth/better-auth "prisma adapter schema user session account verification core schema"`. The fields below match better-auth v1.x core schema.

- [ ] **Step 1: Edit the `User` model**

Remove `clerkId String @unique` and its `@@index([clerkId])`. Add the better-auth columns and keep `roleId`/`isActive`:

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String?
  emailVerified Boolean  @default(false)
  image         String?

  roleId   String
  role     Role    @relation(fields: [roleId], references: [id])
  isActive Boolean @default(true)

  sessions Session[]
  accounts Account[]

  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt
  inspecciones InspeccionFormulario[]

  @@index([roleId])
  @@index([isActive])
}
```

- [ ] **Step 2: Add the better-auth models**

```prisma
model Session {
  id        String   @id @default(uuid())
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model Account {
  id                    String    @id @default(uuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
}

model Verification {
  id         String   @id @default(uuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
}
```

- [ ] **Step 3: Create the migration**

Run: `npx prisma migrate dev --name better_auth_tables`
Expected: migration created and applied to dev DB; `npx prisma generate` runs.

> NOTE: dropping `clerkId` is destructive only for that column. Existing `User` rows keep `id`, `email`, `name`, `roleId`, `isActive`. `emailVerified` defaults to false.

- [ ] **Step 4: Verify the client compiles**

Run: `npx tsc --noEmit`
Expected: errors ONLY in files still referencing `clerkId` (auth.ts, webhook) — these are fixed in later tasks. Note them; do not fix yet.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(auth): add better-auth tables, drop clerkId from User"
```

---

## Phase 3 — Mailer

### Task 3: SMTP mailer with Nodemailer (TDD)

**Files:** Create `src/lib/mailer.ts`, `src/lib/__tests__/mailer.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/mailer.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "abc" });
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

beforeEach(() => sendMailMock.mockClear());

describe("sendMail", () => {
  it("sends an email with from, to, subject and html", async () => {
    const { sendMail } = await import("../mailer");
    await sendMail({ to: "u@test.com", subject: "Hola", html: "<p>Hi</p>" });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.to).toBe("u@test.com");
    expect(arg.subject).toBe("Hola");
    expect(arg.html).toContain("Hi");
    expect(arg.from).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/mailer.test.ts`
Expected: FAIL — cannot resolve `../mailer`.

- [ ] **Step 3: Implement `src/lib/mailer.ts`**

```ts
import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { uploadLogger as logger } from "@/lib/logger";

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  try {
    return await transport.sendMail({ from: env.SMTP_FROM, ...opts });
  } catch (error) {
    logger.error({ error, to: opts.to }, "Error al enviar email");
    throw error;
  }
}
```

> If `logger` has no `uploadLogger`, use `logger` from `@/lib/logger`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/mailer.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mailer.ts src/lib/__tests__/mailer.test.ts
git commit -m "feat(auth): add SMTP mailer with nodemailer"
```

---

## Phase 4 — better-auth server + handler

### Task 4: better-auth server instance

**Files:** Create `src/lib/auth-server.ts`, `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Verify the API for the installed version**

Run: `npx ctx7@latest docs /better-auth/better-auth "betterAuth prismaAdapter emailAndPassword sendResetPassword additionalFields admin plugin nextjs toNextJsHandler"`
Confirm imports: `betterAuth` from `better-auth`, `prismaAdapter` from `better-auth/adapters/prisma`, `toNextJsHandler` from `better-auth/next-js`, `admin` from `better-auth/plugins`.

- [ ] **Step 2: Implement `src/lib/auth-server.ts`**

```ts
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Configurá tu contraseña - Sinergia",
        html: `<p>Hola${user.name ? " " + user.name : ""},</p>
               <p>Configurá tu contraseña haciendo clic <a href="${url}">aquí</a>.</p>`,
      });
    },
  },
  user: {
    additionalFields: {
      roleId: { type: "string", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  plugins: [admin()],
});
```

- [ ] **Step 3: Implement the route handler `src/app/api/auth/[...all]/route.ts`**

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth-server";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no NEW errors in these two files (pre-existing clerkId errors remain).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-server.ts src/app/api/auth
git commit -m "feat(auth): add better-auth server instance and route handler"
```

---

## Phase 5 — Server session helper

### Task 5: Rewrite `getCurrentDbUser` to use better-auth session

**Files:** Modify `src/lib/auth.ts`, Test `src/lib/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
vi.mock("@/lib/auth-server", () => ({
  auth: { api: { getSession: getSessionMock } },
}));
const findUniqueMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: findUniqueMock } } }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));

beforeEach(() => {
  getSessionMock.mockReset();
  findUniqueMock.mockReset();
});

describe("getCurrentDbUser", () => {
  it("returns null when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { getCurrentDbUser } = await import("../auth");
    expect(await getCurrentDbUser()).toBeNull();
  });

  it("loads the db user with role permissions for an active session", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      isActive: true,
      role: { name: "admin", permissions: [{ permission: { code: "clientes:view" } }] },
    });
    const { getCurrentDbUser } = await import("../auth");
    const user = await getCurrentDbUser();
    expect(user?.id).toBe("u1");
    expect(findUniqueMock).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" } }));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/__tests__/auth.test.ts`
Expected: FAIL (current `getCurrentDbUser` uses Clerk `auth()` / `clerkId`).

- [ ] **Step 3: Rewrite `src/lib/auth.ts`**

Replace the Clerk-based implementation. Keep `cache()` and the exported names `getCurrentDbUser`, `getCurrentUserPermissions`, `DEFAULT_ROLE_NAME`, `ADMIN_ROLE_NAME`.

```ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";

export const DEFAULT_ROLE_NAME = "lectura";
export const ADMIN_ROLE_NAME = "admin";

const USER_INCLUDE = {
  role: { include: { permissions: { include: { permission: true } } } },
} as const;

export const getCurrentDbUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: USER_INCLUDE,
  });

  return user;
});

export const getCurrentUserPermissions = cache(async () => {
  const user = await getCurrentDbUser();
  if (!user) return { role: null as string | null, codes: [] as string[] };
  return {
    role: user.role.name,
    codes: user.role.permissions.map((rp) => rp.permission.code),
  };
});
```

> The on-demand bootstrap from Clerk is removed — users now exist in the DB before they can have a session (created via the invitation flow in Task 9).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/auth.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Confirm RBAC guard tests still pass**

Run: `npx vitest run src/lib/__tests__ src/components/informes/components/__tests__ src/components/inspecciones/components/__tests__ src/components/planesTrabajo/components/__tests__`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/__tests__/auth.test.ts
git commit -m "feat(auth): resolve current user from better-auth session"
```

---

## Phase 6 — Client + UI

### Task 6: better-auth React client

**Files:** Create `src/lib/auth-client.ts`

- [ ] **Step 1: Implement the client**

```ts
"use client";
import { createAuthClient } from "better-auth/react";
import { env } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, useSession } = authClient;
```

> `NEXT_PUBLIC_APP_URL` already exists in env. Confirm it equals the site origin.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-client.ts
git commit -m "feat(auth): add better-auth react client"
```

### Task 7: Sign-in and set-password pages

**Files:** Create `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/set-password/page.tsx`; Delete `src/app/sign-in/[[...sign-in]]/page.tsx`

- [ ] **Step 1: Implement the sign-in page**

`src/app/(auth)/sign-in/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Credenciales inválidas");
      return;
    }
    router.push("/dashboard");
  };

  const onForgot = async () => {
    if (!email) return toast.error("Ingresá tu email primero");
    await authClient.requestPasswordReset({ email, redirectTo: "/set-password" });
    toast.success("Te enviamos un email para restablecer la contraseña");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
      <button
        type="button"
        onClick={onForgot}
        className="text-sm text-muted-foreground hover:underline"
      >
        Olvidé mi contraseña
      </button>
    </div>
  );
}
```

> Verify the reset method name (`requestPasswordReset` vs `forgetPassword`) against docs for the installed version in Task 4 Step 1.

- [ ] **Step 2: Implement the set-password page**

`src/app/(auth)/set-password/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "No se pudo configurar la contraseña");
      return;
    }
    toast.success("Contraseña configurada");
    router.push("/sign-in");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Configurar contraseña</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Delete the Clerk sign-in catch-all**

Run: `git rm src/app/sign-in/\[\[...sign-in\]\]/page.tsx`

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in the new pages.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)
git commit -m "feat(auth): custom sign-in and set-password pages"
```

### Task 8: Replace Clerk UI in layout, sidebar and header

**Files:** Modify `src/app/layout.tsx`, `src/components/app-sidebar.tsx`, `src/components/landing/header.tsx`; Create `src/components/auth/user-menu.tsx`

- [ ] **Step 1: Remove `<ClerkProvider>` from `src/app/layout.tsx`**

Delete the `@clerk/nextjs` and `@clerk/localizations` imports and unwrap `<ClerkProvider>` so the body renders its children directly. Remove any `<SignedIn>/<SignedOut>/<SignInButton>/<UserButton>` used at the root.

- [ ] **Step 2: Create `src/components/auth/user-menu.tsx`**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { data } = useSession();
  const name = data?.user?.name ?? data?.user?.email ?? "Usuario";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="truncate">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            router.push("/sign-in");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Update `src/components/app-sidebar.tsx`**

Remove the `@clerk/nextjs` imports (`useUser`, `SignedIn`, `UserButton`). Replace the footer `<SignedIn>...<UserButton /></SignedIn>` block with `<UserMenu />` (import from `@/components/auth/user-menu`). If `useUser()` was used for display, switch to `useSession()` from `@/lib/auth-client`.

- [ ] **Step 4: Update `src/components/landing/header.tsx`**

Replace `<SignedOut>`/`<SignedIn>` from Clerk with a `useSession()` conditional:

```tsx
"use client";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data } = useSession();
  // ...existing markup...
  // if no session -> link to /sign-in ("Iniciar Sesión")
  // if session -> link to /dashboard ("Ir al Dashboard")
}
```

Keep the rest of the header markup intact; only swap the auth-conditional parts.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no Clerk imports remain in these files; no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/components/app-sidebar.tsx src/components/landing/header.tsx src/components/auth/user-menu.tsx
git commit -m "feat(auth): replace Clerk UI components with better-auth"
```

---

## Phase 7 — Middleware + route authorization

### Task 9: Replace middleware and move authorization to the dashboard layout

**Files:** Modify `src/proxy.ts`, `src/app/dashboard/layout.tsx`; Create `src/lib/rbac/authorize-route.ts`

- [ ] **Step 1: Rewrite `src/proxy.ts` to a better-auth cookie check**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PREFIXES = ["/", "/sign-in", "/set-password", "/api/auth"];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL("/sign-in", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

> Verify `getSessionCookie` import path against docs (Task 4 Step 1). The function must be named `proxy` in Next.js 16.

- [ ] **Step 2: Create `src/lib/rbac/authorize-route.ts`**

```ts
import "server-only";
import { getAllowedRoles } from "@/lib/rbac/route-guards";
import type { RoleName } from "@/lib/rbac/permissions";

export function isRoleAllowedForRoute(pathname: string, role: string | null): boolean {
  const allowed = getAllowedRoles(pathname);
  if (allowed === null) return true; // unguarded route: any authenticated user
  if (!role) return false;
  return (allowed as readonly RoleName[]).includes(role as RoleName);
}
```

- [ ] **Step 3: Add the server-side guard in `src/app/dashboard/layout.tsx`**

The layout already calls `getCurrentUserPermissions()`. Add: read the current pathname (via `headers()` `x-pathname`, or pass through a server util) and redirect if the role is not allowed. Since the dashboard layout wraps all dashboard routes, enforce there:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isRoleAllowedForRoute } from "@/lib/rbac/authorize-route";
import { getCurrentUserPermissions } from "@/lib/auth";

// inside the async layout component:
const { role, codes } = await getCurrentUserPermissions();
if (!role) redirect("/sign-in");

const hdrs = await headers();
const pathname = hdrs.get("x-pathname") ?? "";
if (pathname && !isRoleAllowedForRoute(pathname, role)) {
  redirect("/dashboard?forbidden=1");
}
// ...wrap children in <PermissionsProvider role={role} codes={codes}>
```

To make `x-pathname` available, set it in `proxy.ts` before returning:

```ts
const res = NextResponse.next();
res.headers.set("x-pathname", pathname);
return res;
```

(Apply this in both the public and authenticated `NextResponse.next()` branches.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/lib/rbac/authorize-route.ts src/app/dashboard/layout.tsx
git commit -m "feat(auth): better-auth middleware and server-side route authorization"
```

---

## Phase 8 — User creation / invitations + remove webhook

### Task 10: Rewrite user creation with better-auth admin and remove the Clerk webhook

**Files:** Modify `src/components/usuarios/components/actions.ts`; Delete `src/app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Rewrite `createUserAction` in `src/components/usuarios/components/actions.ts`**

Remove `clerkClient` usage. Create the user via better-auth admin API with a random temporary password, set `roleId`, then trigger the set-password email.

```ts
"use server";
import { auth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { dbLogger } from "@/lib/logger";
import { randomBytes } from "crypto";

export async function createUserAction(input: { email: string; roleId: string; name?: string }) {
  await requirePermission(PERMISSIONS.USUARIOS_INVITE);

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw new Error("Rol inválido");

  const tempPassword = randomBytes(24).toString("hex");

  try {
    const created = await auth.api.createUser({
      body: {
        email: input.email,
        password: tempPassword,
        name: input.name ?? "",
        data: { roleId: input.roleId, isActive: true },
      },
    });

    // Trigger the set-password email so the user sets their own password
    await auth.api.requestPasswordReset({
      body: { email: input.email, redirectTo: "/set-password" },
    });

    dbLogger.info({ userId: created.user?.id, email: input.email }, "Usuario creado e invitado");
    return { success: true };
  } catch (error) {
    dbLogger.error({ error, email: input.email }, "Error al crear usuario");
    throw error;
  }
}
```

> Verify `auth.api.createUser` and `auth.api.requestPasswordReset` signatures against docs (admin plugin). If `createUser` does not accept `data` for additionalFields, set `roleId`/`isActive` with a follow-up `prisma.user.update` by the returned user id.

- [ ] **Step 2: Update `getUsers()` in the same file**

Replace the Clerk `clerkClient().users.getUserList()` source with a DB query (users now live entirely in our DB):

```ts
export async function getUsers() {
  await requirePermission(PERMISSIONS.USUARIOS_VIEW);
  const users = await prisma.user.findMany({
    include: { role: { select: { name: true, label: true } } },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    roleId: u.roleId,
    roleName: u.role.name,
    roleLabel: u.role.label,
    isActive: u.isActive,
  }));
}
```

> Update the `AppUser` type and any consumers (`columns.tsx`, `user-form.tsx`) if field names changed.

- [ ] **Step 3: Delete the Clerk webhook**

Run: `git rm src/app/api/webhooks/clerk/route.ts`

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors only where `getUsers`/`AppUser` shape changed — fix those consumers now.

- [ ] **Step 5: Commit**

```bash
git add src/components/usuarios
git commit -m "feat(auth): create users via better-auth, remove clerk webhook"
```

---

## Phase 9 — Remove Clerk

### Task 11: Remove Clerk dependencies, env and references

**Files:** Modify `package.json`, `src/lib/env.ts`; search for residual imports

- [ ] **Step 1: Find any remaining Clerk references**

Run: `grep -rn "@clerk\|clerkClient\|clerkId\|CLERK_\|svix" src/ prisma/`
Expected: only intended leftovers; resolve each (should be none after prior tasks except env removal).

- [ ] **Step 2: Remove Clerk env vars from `src/lib/env.ts`**

Delete `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, all `NEXT_PUBLIC_CLERK_*` from the schema and `runtimeEnv`, and from `.env.example`.

- [ ] **Step 3: Uninstall Clerk packages**

Run: `npm uninstall @clerk/nextjs @clerk/localizations svix`

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: 0 type errors, 0 lint errors, all tests pass.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: build succeeds with no Clerk references.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/env.ts .env.example
git commit -m "chore(auth): remove Clerk dependencies and env"
```

---

## Phase 10 — Cutover & verification

### Task 12: Migrate existing users and verify end-to-end

**Files:** none (operational) — optional `scripts/invite-existing-users.ts`

- [ ] **Step 1: Confirm SMTP works in dev**

Trigger a password reset from the sign-in page ("Olvidé mi contraseña") for a test email and confirm the email arrives.

- [ ] **Step 2: Re-invite the existing (<10) users**

For each existing `User` row (they kept their `id` and `roleId`), trigger the set-password flow:

```ts
// scripts/invite-existing-users.ts (run with: npx tsx scripts/invite-existing-users.ts)
import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";

const users = await prisma.user.findMany({ where: { isActive: true } });
for (const u of users) {
  await auth.api.requestPasswordReset({ body: { email: u.email, redirectTo: "/set-password" } });
  console.log("Invited", u.email);
}
```

> If `createUser` already created accounts, existing rows may lack an `account` (credential) row. In that case create the user via `auth.api.createUser` reusing the same email; better-auth links by email. Verify behavior in dev with one user before running for all.

- [ ] **Step 3: Manual end-to-end checks**

- [ ] Sign in with a valid user → lands on `/dashboard`.
- [ ] Sign in with wrong password → error toast, no redirect.
- [ ] Visit a protected route while logged out → redirected to `/sign-in`.
- [ ] As a non-admin role, open `/dashboard/usuarios` by URL → redirected with `?forbidden=1`.
- [ ] As admin, all routes load.
- [ ] Sidebar shows only modules the role has `*_VIEW` for.
- [ ] Create a user as admin → invite email arrives → set password → sign in works.
- [ ] Sign out → redirected to `/sign-in`, protected routes blocked.

- [ ] **Step 4: Merge to dev**

```bash
git checkout dev
git merge --no-ff feat/better-auth-migration
```

- [ ] **Step 5: Mark ticket #155 (auth front) progress**

Update cc-tickets #155 with the auth migration completion summary (note the RBAC enforcement front remains, per separate spec).

---

## Self-Review (completed during authoring)

- **Spec coverage:** §5.1 data model → Task 2; §5.2 server auth → Tasks 4-5; §5.3 middleware/guard → Task 9; §5.4 client/UI → Tasks 6-8; §5.5 invitations → Task 10; §5.6 mailer → Task 3; §6 cutover → Tasks 11-12; §3 remove Clerk → Task 11. All covered.
- **Placeholder scan:** API-verification notes are explicit (better-auth method names to confirm against installed version) rather than vague TODOs; all code steps include real code.
- **Type consistency:** `getCurrentDbUser`/`getCurrentUserPermissions`/`DEFAULT_ROLE_NAME` names preserved; `authClient`/`useSession` consistent across Tasks 6-8; `isRoleAllowedForRoute` defined in Task 9 and used in same task.
- **Known follow-up:** RBAC `<Can>` enforcement audit is a separate spec (out of scope here).
