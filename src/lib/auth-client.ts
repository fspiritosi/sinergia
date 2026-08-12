"use client";
import { createAuthClient } from "better-auth/react";
import { env } from "@/lib/env";

/**
 * Cliente de better-auth para componentes cliente.
 *
 * `NEXT_PUBLIC_APP_URL` se inlinea en el bundle durante el build, así que en
 * Dokploy tiene que estar como Build Arg (no como Environment) o el cliente
 * apuntaría al valor por defecto del Dockerfile.
 */
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
