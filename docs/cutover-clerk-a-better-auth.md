# Cutover: Clerk → better-auth

Runbook de la puesta en producción. Está diseñado para que **todo sea reversible
hasta la Fase 5**, que es el único paso destructivo.

---

## Antes de empezar

### Lo que hace falta tener a mano

- [ ] **Export de usuarios de Clerk** de la instancia correcta: Dashboard →
      aplicación **Sinergia** (`ins_35ExJUILvWBRWW9IBUjyzPORcPr`) → Users →
      Export. Verificar que salgan los 6 usuarios y que la columna
      `password_digest` venga llena.

      > El CSV `ins_38P6vmH6shySwg2X3J1xoe3hSws` **no sirve**: es de otra
      > aplicación (ecokit). Cero de sus IDs existe en la instancia de Sinergia.

- [ ] **Decidir el buzón de salida.** Hoy quedó configurado y probado el de
      soporte, en Hostinger (donde apuntan los MX de `codecontrol.com.ar`):

      ```
      SMTP_HOST=smtp.hostinger.com
      SMTP_PORT=465
      SMTP_SECURE=true
      SMTP_USER=soporte@codecontrol.com.ar
      SMTP_FROM=Sinergia Ambiental <soporte@codecontrol.com.ar>
      ```

      Funciona y SPF/DKIM alinean, porque el `From` es del mismo dominio que el
      servidor. La contra es de imagen: a los usuarios de Sinergia Ambiental les
      va a llegar el correo desde una dirección de CodeControl. Si se quiere que
      salga como `@sinergiambiental.com.ar`, hay que crear el buzón en el
      hosting de ese dominio y cambiar las cinco variables — **no** basta con
      cambiar el `SMTP_FROM`: con un `From` de un dominio y el servidor de otro,
      SPF/DKIM dejan de alinear y los correos se van a spam.

- [ ] Acceso al panel de Dokploy.

### Variables nuevas en Dokploy

Todas son **server-only**: van en la pestaña **Environment**, no en Build Args.

```
BETTER_AUTH_SECRET=<32 bytes hex — generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
BETTER_AUTH_URL=https://app.sinergiambiental.com.ar
SMTP_HOST=<host del buzón de sinergiambiental.com.ar>
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<usuario>
SMTP_PASS=<contraseña>
SMTP_FROM=Sinergia Ambiental <no-reply@sinergiambiental.com.ar>
```

`BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` tienen que apuntar **al mismo dominio
que sirve Traefik**, o el login falla por origen no confiable. Verificar contra
`/etc/dokploy/traefik/dynamic/<app>.yml`.

Las variables `CLERK_*` y `NEXT_PUBLIC_CLERK_*` **se dejan como están** hasta la
Fase 5: son las que permiten volver atrás.

> ### Cuidado con `$` y `#` en la contraseña SMTP
>
> Es un problema real, no teórico: la contraseña de soporte contiene ambos
> caracteres y se corrompía en silencio al leerla.
>
> - `#` inicia un comentario, así que trunca el valor.
> - `$W` se interpreta como la variable `W` y **se reemplaza por vacío**, incluso
>   entre comillas simples (el cargador de Next hace expansión igual).
>
> En un archivo `.env` hay que escaparla: `SMTP_PASS='...\$W'`. Al cargarla en
> Dokploy conviene **verificar después que llegó completa**, porque el resultado
> de que no llegue es una autenticación que falla sin decir por qué.
>
> Para comprobarlo de punta a punta hay un script:
>
> ```bash
> npx tsx scripts/probar-smtp.ts alguien@ejemplo.com
> ```
>
> Autentica contra el servidor y manda un correo real, informando si el
> destinatario fue aceptado o rechazado.

---

## Fase 0 — Respaldo (imprescindible)

```bash
ssh yordan@31.97.42.82 'docker exec <contenedor-postgres> pg_dump -U codecontrol -d sinergia -F c -f /tmp/pre-better-auth.dump'
```

Etiquetar el punto de retorno del código:

```bash
git tag pre-better-auth
```

---

## Fase 1 — Migración de schema (aditiva, sin riesgo)

La migración `20260811134820_add_better_auth_tables` **no borra nada**:

```sql
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
                   ADD COLUMN "image" TEXT,
                   ALTER COLUMN "clerkId" DROP NOT NULL;
CREATE TABLE "Session" (...);
CREATE TABLE "Account" (...);
CREATE TABLE "Verification" (...);
```

Se aplica sola al desplegar, porque el `CMD` del Dockerfile corre
`prisma migrate deploy` al arrancar el contenedor.

**Reversible**: `DROP TABLE` de las tres nuevas y volver `clerkId` a NOT NULL.
Nada las usa todavía.

---

## Fase 2 — Importar las contraseñas

Con el CSV correcto, primero en seco:

```bash
npx tsx scripts/import-clerk-passwords.ts <ruta-al-csv> --dry-run
```

Revisar el resumen. Debe decir **6 importados** y ningún "sin usuario". Después,
de verdad:

```bash
npx tsx scripts/import-clerk-passwords.ts <ruta-al-csv>
```

El script:

- Nunca crea usuarios: si un email del CSV no está en la base, lo informa y sigue.
- Preserva `User.id`, así que las FK de `InspeccionFormulario` quedan intactas.
- Marca `emailVerified = true` (si no, `requireEmailVerification` les impediría entrar).
- Es idempotente: se puede correr de nuevo sin duplicar nada.
- Al terminar avisa si quedó algún usuario activo **sin credenciales** — esos no
  van a poder entrar y necesitan usar "Olvidé mi contraseña".

**Reversible**: `DELETE FROM "Account" WHERE "providerId" = 'credential';`

---

## Fase 3 — Reasignar el historial de tickets

```bash
npx tsx scripts/migrate-support-ticket-views.ts --dry-run
npx tsx scripts/migrate-support-ticket-views.ts
```

Son 3 filas de un solo usuario. Es cosmético (si no se hace, esos tickets
vuelven a figurar como no leídos), **pero hay que correrlo antes de la Fase 5**:
una vez eliminada la columna `clerkId` ya no hay forma de mapear un id con otro.

---

## Fase 4 — Desplegar el código

Deploy normal por Dokploy. A partir de acá la app usa better-auth.

**Todas las sesiones activas se cierran**: los usuarios van a tener que volver a
entrar, con la misma contraseña de siempre. Conviene avisarles antes.

### Verificación inmediata

- [ ] Entrar con un usuario admin → llega a `/dashboard`
- [ ] Entrar con contraseña incorrecta → error, sin sesión
- [ ] Con un usuario `lectura`, abrir `/dashboard/usuarios` por URL → rebota a
      `/dashboard?forbidden=1`
- [ ] El sidebar muestra sólo los módulos del rol
- [ ] Invitar a un usuario → llega el correo → define contraseña → entra
- [ ] "Olvidé mi contraseña" → llega el correo
- [ ] Cerrar sesión → las rutas protegidas vuelven a pedir login

### Si algo sale mal: rollback

Redesplegar el tag `pre-better-auth` desde Dokploy. Funciona porque:

- La columna `clerkId` sigue existiendo y poblada.
- Las variables `CLERK_*` siguen configuradas.
- El webhook de Clerk sigue activo.

Las tablas nuevas quedan ahí sin molestar a nadie.

---

## Fase 5 — Punto de no retorno

**Sólo después de varios días sin incidentes.**

1. Nuevo `pg_dump` (ahora sí antes de borrar algo real).
2. Migración que elimina `clerkId` de `User`.
3. Borrar `src/app/api/webhooks/clerk/route.ts`.
4. `npm uninstall @clerk/nextjs @clerk/localizations svix`.
5. Sacar `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` y las `NEXT_PUBLIC_CLERK_*`
   de `src/lib/env.ts`, del `Dockerfile` y de Dokploy.
6. Recién ahora, desactivar el webhook en el dashboard de Clerk. Si se desactiva
   antes y hace falta un rollback, la imagen vieja se queda sin sincronización.

---

## Qué puede fallar

| Síntoma                                         | Causa probable                                    | Qué hacer                                                                      |
| ----------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Nadie puede entrar, con la contraseña correcta  | El import no corrió, o corrió contra otra base    | Revisar que existan filas en `Account` con `providerId='credential'`           |
| Un usuario puntual no entra                     | No tenía contraseña en Clerk (alta por OAuth)     | Que use "Olvidé mi contraseña"                                                 |
| Login responde OK pero vuelve al login          | `BETTER_AUTH_URL` no coincide con el dominio real | Corregir en Dokploy y redesplegar                                              |
| 500 al entrar, `table "Session" does not exist` | La migración no se aplicó                         | Verificar que `prisma/migrations/` esté en la imagen                           |
| No llega ningún correo                          | SMTP mal configurado                              | Revisar los logs: el mailer registra `Email enviado` o `Error al enviar email` |
| `EAUTH` / `535 authentication failed` en el log | `SMTP_PASS` llegó truncada a Dokploy              | `docker exec <cont> sh -c 'echo ${#SMTP_PASS}'` y comparar con el largo real   |
| Un rol ve rutas que no debería                  | El guard no está corriendo                        | `npx vitest run src/__tests__/proxy.test.ts`                                   |

---

## Notas

- **No correr `prisma/seed-rbac.ts` contra producción.** Producción tiene 13
  permisos asignados a mano desde la UI (gerente 21 y tecnico 19, contra 17 y 10
  del seed) y el seed sincroniza en ambos sentidos: los revocaría.
- El registro público en `/sign-up` sigue abierto, igual que hoy. Si se quiere
  cerrar, es una decisión aparte de esta migración.
