# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine

# ---------- Stage 1: deps ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./

ENV HUSKY=0

RUN npm ci --ignore-scripts

# ---------- Stage 2: builder ----------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ---------------------------------------------------------------------------
# Variables de entorno: dónde va cada una en Dokploy
#
#   BUILD ARGS (acá abajo, se hornean en el bundle durante el build):
#     todas las NEXT_PUBLIC_*
#
#   ENVIRONMENT (se leen en runtime, NO hace falta declararlas acá):
#     DATABASE_URL, CLOUDFLARE_*,
#     BETTER_AUTH_SECRET, BETTER_AUTH_URL,
#     SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
#
# BETTER_AUTH_URL y NEXT_PUBLIC_APP_URL deben apuntar ambas al dominio real que
# sirve Traefik, o el login falla por origen no confiable.
# ---------------------------------------------------------------------------

# NEXT_PUBLIC_* vars get inlined into the client bundle at build time.
# Dokploy must pass these as Build Args (dummy defaults let image build
# even if a value is absent, but the real value must be provided).
# Placeholder has valid Clerk format (pk_test_<base64-domain>) so the
# build doesn't fail if no build arg is passed. The real key must be
# set as a build arg in Dokploy — it gets inlined into the client bundle.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
ARG NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL}
ENV NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV HUSKY=0

# Generate Prisma client for the image's glibc/musl combo.
# Dummy DATABASE_URL satisfies prisma.config.ts; generate itself
# doesn't touch the DB.
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate

RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000

# El stage `deps` corre `npm ci --ignore-scripts`, así que `postinstall` NUNCA se
# ejecuta en la imagen: el esquema y los datos de RBAC se ponen al día acá, al
# arrancar el contenedor.
#
# `migrate deploy` trae el esquema; `sync-permissions` trae las filas de permisos,
# que son datos y por lo tanto ninguna migración las incluye. Sin ese segundo paso
# un permiso nuevo queda desplegado pero inexistente en la base, y la feature que
# lo usa es invisible incluso para un administrador.
#
# Ambos comandos usan devDependencies (`prisma`, `tsx`) presentes en la imagen
# porque `npm ci` no poda las de desarrollo. No agregar `--omit=dev` sin mover
# esos dos paquetes a `dependencies`.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/sync-permissions.ts && node node_modules/next/dist/bin/next start"]
