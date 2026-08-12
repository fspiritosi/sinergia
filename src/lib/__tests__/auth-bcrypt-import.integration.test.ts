// @vitest-environment node
//
// Test de integración contra la base local (container sinergia-local-db).
// Verifica lo único que no se puede dar por sentado de toda la migración: que
// una contraseña hasheada por Clerk con bcrypt sirve para iniciar sesión en
// better-auth, que usa scrypt por defecto.
//
// Requiere haber corrido antes:
//   npx tsx scripts/import-clerk-passwords.ts <csv>
//
// Se salta solo si la base no está levantada, para no romper la suite de quien
// no tenga el entorno local.
import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";

const EMAIL = "verificacion-bcrypt@sinergia.local";
const PASSWORD_ORIGINAL = "ClaveDeClerk123!";

let hayBase = false;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    hayBase = true;
  } catch {
    return;
  }

  const rol = await prisma.role.findFirst({ where: { name: "lectura" } });
  if (!rol) throw new Error("Falta el seed de RBAC en la base local");

  await prisma.user.deleteMany({ where: { email: EMAIL } });

  // Hash con el prefijo $2a$ que genera Clerk (bcryptjs emite $2b$).
  const digestDeClerk = bcrypt.hashSync(PASSWORD_ORIGINAL, 10).replace(/^\$2b\$/, "$2a$");

  const user = await prisma.user.create({
    data: { email: EMAIL, name: "Verificación Bcrypt", roleId: rol.id, emailVerified: true },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: digestDeClerk,
    },
  });
});

describe("login con contraseña importada de Clerk", () => {
  it("acepta la contraseña original contra un hash bcrypt $2a$", async () => {
    if (!hayBase) return;

    const res = await auth.api.signInEmail({
      body: { email: EMAIL, password: PASSWORD_ORIGINAL },
    });

    expect(res.user?.email).toBe(EMAIL);
  });

  it("rechaza una contraseña incorrecta", async () => {
    if (!hayBase) return;

    await expect(
      auth.api.signInEmail({ body: { email: EMAIL, password: "no-es-la-clave" } })
    ).rejects.toThrow();
  });

  it("los usuarios importados quedan con email verificado", async () => {
    if (!hayBase) return;

    // Sólo los importados desde Clerk (los que conservan clerkId). Un usuario
    // recién auto-registrado tiene credenciales y NO está verificado todavía,
    // que es el comportamiento correcto y no debe hacer fallar esto.
    const sinVerificar = await prisma.user.findMany({
      where: { isActive: true, emailVerified: false, clerkId: { not: null } },
      select: { email: true },
    });

    // Con requireEmailVerification activo, un importado sin verificar no
    // podría entrar nunca.
    expect(sinVerificar.map((u) => u.email)).toEqual([]);
  });

  it("ningún usuario activo queda sin credenciales", async () => {
    if (!hayBase) return;

    const huerfanos = await prisma.user.findMany({
      where: { isActive: true, accounts: { none: { providerId: "credential" } } },
      select: { email: true },
    });

    expect(huerfanos.map((u) => u.email)).toEqual([]);
  });
});
