// @vitest-environment node
//
// Flujo de alta por invitación de punta a punta, contra la base local:
// invitar → obtener el token del correo → definir la contraseña desde
// /set-password → iniciar sesión con esa contraseña.
//
// Es el recorrido que hace una persona invitada, y el que deja el sistema
// inservible para altas nuevas si se rompe. Los tests anteriores cubrían las
// piezas por separado, pero no que encajaran entre sí.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const { sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn().mockResolvedValue({ messageId: "test" }),
}));
vi.mock("@/lib/mailer", () => ({ sendMail: sendMailMock }));

import prisma from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { userRepository } from "@/repositories/user.repository";

const EMAIL = "flujo-completo@sinergia.local";
const PASSWORD_ELEGIDA = "MiClaveNueva123!";

let hayBase = false;
let rolId = "";

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    hayBase = true;
  } catch {
    return;
  }
  const rol = await prisma.role.findFirst({ where: { name: "tecnico" } });
  rolId = rol!.id;
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  sendMailMock.mockClear();
});

afterAll(async () => {
  if (hayBase) await prisma.user.deleteMany({ where: { email: EMAIL } });
});

describe("flujo completo de invitación", () => {
  it("un invitado define su contraseña desde el enlace y entra con ella", async () => {
    if (!hayBase) return;

    // 1. El admin lo invita (lo que hace createUserAction).
    const user = await userRepository.createInvited({
      email: EMAIL,
      name: "Flujo Completo",
      roleId: rolId,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
    });

    await auth.api.requestPasswordReset({ body: { email: EMAIL, redirectTo: "/set-password" } });

    // 2. Se extrae el token del enlace que salió por correo, igual que haría
    //    la persona al hacer clic.
    const html = String(sendMailMock.mock.calls[0][0].html);
    const url = html.match(/https?:\/\/[^"<\s]+/)![0];
    const token = url.match(/reset-password\/([^?]+)/)![1];
    expect(token).toBeTruthy();

    // 3. Define su contraseña (lo que hace la página /set-password).
    const reset = await auth.api.resetPassword({
      body: { newPassword: PASSWORD_ELEGIDA, token },
    });
    expect(reset.status).toBe(true);

    // 4. Entra con esa contraseña recién elegida.
    const sesion = await auth.api.signInEmail({
      body: { email: EMAIL, password: PASSWORD_ELEGIDA },
    });
    expect(sesion.user?.email).toBe(EMAIL);
    expect(sesion.user?.id).toBe(user.id);
  }, 60000);

  it("conserva el rol asignado en la invitación", async () => {
    if (!hayBase) return;

    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      include: { role: true },
    });
    expect(user?.role.name).toBe("tecnico");
  });

  it("el token no se puede reutilizar", async () => {
    if (!hayBase) return;

    const html = String(sendMailMock.mock.calls[0][0].html);
    const token = html.match(/reset-password\/([^?"]+)/)![1];

    await expect(
      auth.api.resetPassword({ body: { newPassword: "OtraClave456!", token } })
    ).rejects.toThrow();
  });
});
