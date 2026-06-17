"use server";

import { currentUser } from "@clerk/nextjs/server";

export interface ReporterSession {
  email: string;
  name: string | null;
  /** ID estable del usuario en tu sistema de auth. Usado como FK en support_ticket_views. */
  userId: string;
}

/**
 * Devuelve la identidad del usuario actual (email, nombre y userId) o null si
 * no hay sesión. Implementado contra Clerk (auth provider de sinergia).
 */
export async function getReporterEmail(): Promise<ReporterSession | null> {
  const user = await currentUser();
  if (!user) return null;

  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  if (!email) return null;

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || null;

  return { email, name, userId: user.id };
}
