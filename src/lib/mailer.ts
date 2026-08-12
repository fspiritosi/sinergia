import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";
import { mailLogger } from "@/lib/logger";

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  /** Alternativa en texto plano. Si se omite se deriva del html. */
  text?: string;
};

type Transport = ReturnType<typeof nodemailer.createTransport>;

let transport: Transport | null = null;

/**
 * Se crea perezosamente: importar este módulo no debe abrir una conexión SMTP
 * (el build de Next importa los módulos server para el análisis de rutas).
 */
function getTransport(): Transport {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transport;
}

/**
 * Versión en texto plano del cuerpo HTML. Los correos que sólo traen HTML
 * puntúan peor en los filtros de spam, y este sistema ya viene de tener
 * problemas de entrega — vale la pena mandar siempre ambas partes.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendMail({ to, subject, html, text }: SendMailOptions) {
  try {
    const info = await getTransport().sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text: text ?? htmlToText(html),
    });

    mailLogger.info({ to, subject }, "Email enviado");
    return info;
  } catch (error) {
    // Nunca loguear el cuerpo: puede contener tokens de invitación o reseteo.
    mailLogger.error({ error, to, subject }, "Error al enviar email");
    throw error;
  }
}
