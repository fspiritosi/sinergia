// @vitest-environment node
//
// Flujo de alta por invitación contra la base local, sin pasar por la UI.
// Reproduce lo que hace createUserAction: crear el usuario con credenciales y
// disparar el correo para que defina su contraseña.
//
// El envío SMTP se mockea: el test verifica que se manda el mail correcto, no
// que el servidor de correo esté vivo.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

// vi.hoisted porque vi.mock se eleva por encima de las declaraciones normales.
const { sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn().mockResolvedValue({ messageId: "test" }),
}));
vi.mock("@/lib/mailer", () => ({ sendMail: sendMailMock }));

import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { userRepository } from "@/repositories/user.repository";

const EMAIL = "invitado-integracion@sinergia.local";
let hayBase = false;
let rolTecnicoId = "";

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    hayBase = true;
  } catch {
    return;
  }

  const rol = await prisma.role.findFirst({ where: { name: "tecnico" } });
  if (!rol) throw new Error("Falta el seed de RBAC en la base local");
  rolTecnicoId = rol.id;

  await prisma.user.deleteMany({ where: { email: EMAIL } });
  sendMailMock.mockClear();
});

afterAll(async () => {
  if (hayBase) await prisma.user.deleteMany({ where: { email: EMAIL } });
});

describe("alta por invitación", () => {
  it("crea el usuario con su rol, credenciales y email verificado", async () => {
    if (!hayBase) return;

    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

    const user = await userRepository.createInvited({
      email: EMAIL,
      name: "Invitado Integración",
      roleId: rolTecnicoId,
      passwordHash,
    });

    expect(user.roleId).toBe(rolTecnicoId);
    // Sin emailVerified, requireEmailVerification le impediría entrar.
    expect(user.emailVerified).toBe(true);
    expect(user.isActive).toBe(true);

    const cuenta = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    expect(cuenta?.password).toBe(passwordHash);
  });

  it("envía el correo para definir la contraseña", async () => {
    if (!hayBase) return;

    await auth.api.requestPasswordReset({
      body: { email: EMAIL, redirectTo: "/set-password" },
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.to).toBe(EMAIL);
    expect(arg.subject).toContain("contraseña");

    // better-auth no enlaza directo a /set-password: manda a su propio endpoint
    // con el token en el path, que lo valida y recién ahí redirige a la página
    // indicada en callbackURL. Ambas rutas tienen que estar en PUBLIC_PREFIXES
    // del proxy, porque el invitado llega sin sesión.
    const url = String(arg.html).match(/https?:\/\/[^"<\s]+/)?.[0] ?? "";
    expect(url).toContain("/api/auth/reset-password/");
    expect(url).toContain("callbackURL=%2Fset-password");
  });

  it("no crea el usuario si falla la creación de credenciales (transacción)", async () => {
    if (!hayBase) return;

    const EMAIL_FALLIDO = "invitado-que-falla@sinergia.local";

    await expect(
      userRepository.createInvited({
        email: EMAIL_FALLIDO,
        name: "X",
        roleId: "rol-que-no-existe",
        passwordHash: "hash",
      })
    ).rejects.toThrow();

    // Se comprueba por email y no con un count() global: los archivos de test
    // corren en paralelo contra la misma base y el total se mueve solo.
    expect(await prisma.user.findUnique({ where: { email: EMAIL_FALLIDO } })).toBeNull();
  });
});
