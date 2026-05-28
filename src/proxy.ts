import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAllowedRoles } from "@/lib/rbac/route-guards";
import type { RoleName } from "@/lib/rbac/permissions";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  const allowed = getAllowedRoles(req.nextUrl.pathname);
  if (!allowed) return;

  const { sessionClaims } = await auth();

  // Lee el rol del session token (requiere customization en Clerk Dashboard:
  // Sessions → Customize session token → { "metadata": "{{user.public_metadata}}" })
  const metadata = (sessionClaims?.metadata as { role?: string } | undefined) ?? {};
  const role = (metadata.role ?? "lectura") as RoleName;

  if (!allowed.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "?forbidden=1";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
