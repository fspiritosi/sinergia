import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Header con el que el middleware le pasa la ruta actual a los layouts.
 * Los Server Components no reciben el pathname por props, y `headers()` lee
 * los de la request: por eso hay que reinyectarlo en la request (ver abajo).
 */
export const PATHNAME_HEADER = "x-pathname";

/**
 * Mismas rutas públicas que tenía la versión con Clerk, más el handler de
 * better-auth y `/set-password` (destino de invitaciones y reseteos: el
 * invitado llega ahí sin sesión, así que no puede exigirse cookie).
 */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/set-password", "/api/webhooks", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Sólo verifica que exista cookie de sesión; no valida contra la DB ni resuelve
 * el rol. Es lo que better-auth recomienda para middleware (`getSessionCookie`
 * es una lectura optimista): la validación real de sesión la hace
 * `auth.api.getSession()` en los layouts, y la autorización por rol la hace
 * `isRoleAllowedForRoute` ahí mismo, donde ya se consulta la DB de todos modos.
 *
 * Mantener Prisma fuera del bundle del middleware es deliberado.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // CUIDADO al tocar esto: el pathname debe ir en los headers de la REQUEST,
  // no en los de la respuesta. `NextResponse.next()` + `res.headers.set(...)`
  // escribe la respuesta que va al navegador, y `headers()` en un Server
  // Component lee la request — el guard de rol quedaría inerte y sin error,
  // dejando entrar a cualquier autenticado a cualquier ruta.
  // Cubierto por src/__tests__/proxy.test.ts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Ignora internals de Next y archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre corre para rutas de API
    "/(api|trpc)(.*)",
  ],
};
