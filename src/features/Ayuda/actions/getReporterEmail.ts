"use server";

import { getCurrentDbUser } from "@/lib/auth";

export interface ReporterSession {
  email: string;
  name: string | null;
  /** ID estable del usuario en tu sistema de auth. Usado como FK en support_ticket_views. */
  userId: string;
}

/**
 * Devuelve la identidad del usuario actual (email, nombre y userId) o null si
 * no hay sesión.
 *
 * `userId` pasó a ser `User.id` (uuid de nuestra base). Antes era el id crudo
 * de Clerk (`user_xxx`), que es lo que quedó guardado en
 * `support_ticket_views.user_id` para las filas anteriores a la migración: ese
 * histórico se reasigna en el script scripts/migrate-support-ticket-views.ts.
 */
export async function getReporterEmail(): Promise<ReporterSession | null> {
  const user = await getCurrentDbUser();
  if (!user) return null;

  return { email: user.email, name: user.name, userId: user.id };
}
