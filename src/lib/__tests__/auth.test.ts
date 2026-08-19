import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
const findByIdWithPermissionsMock = vi.fn();

vi.mock("@/lib/auth-server", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/repositories/user.repository", () => ({
  userRepository: { findByIdWithPermissions: findByIdWithPermissionsMock },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

beforeEach(() => {
  getSessionMock.mockReset();
  findByIdWithPermissionsMock.mockReset();
  vi.resetModules();
});

const userConPermisos = {
  id: "u1",
  email: "test@sinergia.local",
  isActive: true,
  role: {
    name: "admin",
    permissions: [
      { permission: { code: "clientes:view" } },
      { permission: { code: "usuarios:invite" } },
    ],
  },
};

describe("getCurrentDbUser", () => {
  it("devuelve null cuando no hay sesión", async () => {
    getSessionMock.mockResolvedValue(null);
    const { getCurrentDbUser } = await import("../auth");

    expect(await getCurrentDbUser()).toBeNull();
    expect(findByIdWithPermissionsMock).not.toHaveBeenCalled();
  });

  it("devuelve null cuando la sesión no trae user.id", async () => {
    getSessionMock.mockResolvedValue({ user: {} });
    const { getCurrentDbUser } = await import("../auth");

    expect(await getCurrentDbUser()).toBeNull();
  });

  it("busca al usuario por User.id, no por un id externo", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findByIdWithPermissionsMock.mockResolvedValue(userConPermisos);
    const { getCurrentDbUser } = await import("../auth");

    const user = await getCurrentDbUser();

    expect(findByIdWithPermissionsMock).toHaveBeenCalledWith("u1");
    expect(user?.id).toBe("u1");
  });

  it("devuelve null si la sesión apunta a un usuario inexistente", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "fantasma" } });
    findByIdWithPermissionsMock.mockResolvedValue(null);
    const { getCurrentDbUser } = await import("../auth");

    expect(await getCurrentDbUser()).toBeNull();
  });
});

describe("getCurrentUserPermissions", () => {
  it("devuelve rol y códigos de permiso", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "u1" } });
    findByIdWithPermissionsMock.mockResolvedValue(userConPermisos);
    const { getCurrentUserPermissions } = await import("../auth");

    const { role, codes } = await getCurrentUserPermissions();

    expect(role).toBe("admin");
    expect(codes).toEqual(["clientes:view", "usuarios:invite"]);
  });

  it("devuelve rol null y lista vacía sin sesión, para que el guard falle cerrado", async () => {
    getSessionMock.mockResolvedValue(null);
    const { getCurrentUserPermissions } = await import("../auth");

    expect(await getCurrentUserPermissions()).toEqual({ role: null, codes: [] });
  });
});
