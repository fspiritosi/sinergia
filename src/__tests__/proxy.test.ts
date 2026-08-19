import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ROUTE_GUARDS } from "@/lib/rbac/route-guards";
import { isRoleAllowedForRoute } from "@/lib/rbac/authorize-route";
import { ROLES } from "@/lib/rbac/permissions";

const getSessionCookieMock = vi.fn();
vi.mock("better-auth/cookies", () => ({
  getSessionCookie: (...args: unknown[]) => getSessionCookieMock(...args),
}));

import { proxy, PATHNAME_HEADER } from "@/proxy";

function request(pathname: string) {
  return new NextRequest(new URL(`https://app.local${pathname}`));
}

beforeEach(() => {
  getSessionCookieMock.mockReset();
});

describe("proxy — propagación del pathname (regresión de seguridad)", () => {
  // Este es EL test que atrapa el bug: si alguien vuelve a usar
  // `res.headers.set(PATHNAME_HEADER, ...)`, el pathname viaja en la respuesta
  // hacia el navegador y nunca llega a `headers()` en el layout. El guard de
  // rol quedaría inerte sin lanzar ningún error.
  it("reinyecta el pathname en los headers de la REQUEST, no de la respuesta", () => {
    getSessionCookieMock.mockReturnValue("cookie-valida");

    const res = proxy(request("/dashboard/usuarios"));

    // Next expone los headers reinyectados con el prefijo x-middleware-request-
    expect(res.headers.get(`x-middleware-request-${PATHNAME_HEADER}`)).toBe("/dashboard/usuarios");
    expect(res.headers.get("x-middleware-override-headers")).toContain(PATHNAME_HEADER);
  });

  it("no expone el pathname como header de respuesta (sería el modo incorrecto)", () => {
    getSessionCookieMock.mockReturnValue("cookie-valida");

    const res = proxy(request("/dashboard/usuarios"));

    expect(res.headers.get(PATHNAME_HEADER)).toBeNull();
  });

  it("propaga el pathname en todas las rutas guardadas", () => {
    getSessionCookieMock.mockReturnValue("cookie-valida");

    for (const prefix of Object.keys(ROUTE_GUARDS)) {
      const res = proxy(request(prefix));
      expect(
        res.headers.get(`x-middleware-request-${PATHNAME_HEADER}`),
        `el guard de ${prefix} se quedaría sin pathname`
      ).toBe(prefix);
    }
  });
});

describe("proxy — sesión", () => {
  it("redirige a /sign-in cuando no hay cookie de sesión", () => {
    getSessionCookieMock.mockReturnValue(null);

    const res = proxy(request("/dashboard/usuarios"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/sign-in");
  });

  it("bloquea toda ruta guardada cuando no hay sesión", () => {
    getSessionCookieMock.mockReturnValue(null);

    for (const prefix of Object.keys(ROUTE_GUARDS)) {
      const res = proxy(request(prefix));
      expect(res.headers.get("location"), `${prefix} quedó accesible sin sesión`).toContain(
        "/sign-in"
      );
    }
  });

  it("deja pasar las rutas públicas sin sesión", () => {
    getSessionCookieMock.mockReturnValue(null);

    for (const pathname of [
      "/",
      "/sign-in",
      "/sign-up",
      // Un invitado llega acá sin sesión: si se exigiera cookie, el enlace de
      // la invitación lo mandaría a /sign-in y nunca podría definir su clave.
      "/set-password",
      "/api/auth/sign-in/email",
    ]) {
      const res = proxy(request(pathname));
      expect(res.headers.get("location"), `${pathname} no debería redirigir`).toBeNull();
    }
  });

  it("no bloquea el propio handler de better-auth (si no, el login se bloquearía a sí mismo)", () => {
    getSessionCookieMock.mockReturnValue(null);

    const res = proxy(request("/api/auth/sign-in/email"));

    expect(res.headers.get("location")).toBeNull();
  });
});

describe("isRoleAllowedForRoute — matriz completa de ROUTE_GUARDS", () => {
  const TODOS_LOS_ROLES = Object.values(ROLES);

  it("permite exactamente los roles declarados en cada prefijo", () => {
    for (const [prefix, permitidos] of Object.entries(ROUTE_GUARDS)) {
      for (const rol of TODOS_LOS_ROLES) {
        const esperado = (permitidos as readonly string[]).includes(rol);
        expect(isRoleAllowedForRoute(prefix, rol), `${rol} en ${prefix}`).toBe(esperado);
      }
    }
  });

  it("aplica el guard también a subrutas", () => {
    for (const [prefix, permitidos] of Object.entries(ROUTE_GUARDS)) {
      for (const rol of TODOS_LOS_ROLES) {
        const esperado = (permitidos as readonly string[]).includes(rol);
        expect(isRoleAllowedForRoute(`${prefix}/algo/anidado`, rol), `${rol} en ${prefix}/…`).toBe(
          esperado
        );
      }
    }
  });

  it("nunca deja pasar a un usuario sin rol por una ruta guardada", () => {
    for (const prefix of Object.keys(ROUTE_GUARDS)) {
      expect(isRoleAllowedForRoute(prefix, null), `${prefix} con rol null`).toBe(false);
    }
  });

  it("las rutas no listadas quedan libres para cualquier autenticado", () => {
    expect(isRoleAllowedForRoute("/dashboard", ROLES.LECTURA)).toBe(true);
    expect(isRoleAllowedForRoute("/dashboard/help", ROLES.LECTURA)).toBe(true);
  });

  it("respeta la precedencia del prefijo más largo", () => {
    // /dashboard/clientes es admin-only, pero /dashboard/clientes/propuestas
    // suma gerente y lectura. Si el orden se rompiera, gerente perdería acceso.
    expect(isRoleAllowedForRoute("/dashboard/clientes", ROLES.GERENTE)).toBe(false);
    expect(isRoleAllowedForRoute("/dashboard/clientes/propuestas", ROLES.GERENTE)).toBe(true);
  });
});
