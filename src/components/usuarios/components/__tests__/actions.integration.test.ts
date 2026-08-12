// @vitest-environment node
//
// Acciones del módulo de usuarios que cambiaron con la migración a better-auth,
// contra la base local. Antes el rol vivía en dos lugares (publicMetadata de
// Clerk y User.roleId) y AppUser.id era el id de Clerk; ahora todo sale de la
// base y el id es el uuid propio.
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const { requirePermissionMock } = vi.hoisted(() => ({
  requirePermissionMock: vi.fn().mockResolvedValue({ id: "admin-test", isActive: true }),
}));

// Sin sesión simulada, requirePermission rechaza todo. Lo que se prueba acá es
// el efecto de las acciones, no el control de acceso (cubierto en proxy.test.ts).
vi.mock("@/lib/rbac/require", () => ({
  requirePermission: requirePermissionMock,
  requireRole: requirePermissionMock,
  hasPermission: vi.fn().mockResolvedValue(true),
}));

import prisma from "@/lib/db";
import { userRepository } from "@/repositories/user.repository";
import { getUsers, updateUserRole, getRolesForSelect } from "../actions";

const EMAIL = "acciones-usuarios@sinergia.local";
let hayBase = false;
let userId = "";
let rolTecnico = "";
let rolLectura = "";

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    hayBase = true;
  } catch {
    return;
  }

  rolTecnico = (await prisma.role.findFirst({ where: { name: "tecnico" } }))!.id;
  rolLectura = (await prisma.role.findFirst({ where: { name: "lectura" } }))!.id;

  await prisma.user.deleteMany({ where: { email: EMAIL } });
  const u = await userRepository.createInvited({
    email: EMAIL,
    name: "Acciones Prueba",
    roleId: rolLectura,
    passwordHash: await bcrypt.hash(randomBytes(16).toString("hex"), 10),
  });
  userId = u.id;
});

afterAll(async () => {
  if (hayBase) await prisma.user.deleteMany({ where: { email: EMAIL } });
});

describe("getUsers", () => {
  it("lista desde la base, sin el tope de 50 que tenía Clerk", async () => {
    if (!hayBase) return;

    const users = await getUsers();
    const nuestro = users.find((u) => u.email === EMAIL);

    expect(nuestro).toBeDefined();
    // AppUser.id ahora es User.id (uuid), antes era el id de Clerk (user_xxx).
    expect(nuestro!.id).toBe(userId);
    expect(nuestro!.id).not.toMatch(/^user_/);
  });

  it("parte el nombre en nombre y apellido", async () => {
    if (!hayBase) return;

    const nuestro = (await getUsers()).find((u) => u.email === EMAIL)!;
    expect(nuestro.firstName).toBe("Acciones");
    expect(nuestro.lastName).toBe("Prueba");
  });

  it("expone el rol legible", async () => {
    if (!hayBase) return;

    const nuestro = (await getUsers()).find((u) => u.email === EMAIL)!;
    expect(nuestro.roleName).toBe("lectura");
    expect(nuestro.roleLabel).toBe("Solo lectura");
  });
});

describe("updateUserRole", () => {
  it("cambia el rol en la base usando User.id", async () => {
    if (!hayBase) return;

    await updateUserRole({ userId, roleId: rolTecnico });

    const u = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    expect(u?.role.name).toBe("tecnico");
  });

  it("rechaza un rol inexistente", async () => {
    if (!hayBase) return;

    await expect(updateUserRole({ userId, roleId: "no-existe" })).rejects.toThrow(
      /rol seleccionado no existe/i
    );
  });
});

describe("getRolesForSelect", () => {
  it("exige permiso antes de devolver los roles", async () => {
    if (!hayBase) return;

    requirePermissionMock.mockClear();
    const roles = await getRolesForSelect();

    expect(requirePermissionMock).toHaveBeenCalled();
    expect(roles.length).toBeGreaterThan(0);
  });
});
