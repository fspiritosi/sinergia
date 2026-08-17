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

/**
 * Traduce el error de nodemailer a algo que le sirva a quien lo lee en un toast
 * o en el log, sin tener que ir a buscar qué significa el código.
 */
function describirFallo(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const mensaje = error instanceof Error ? error.message : String(error);

  switch (code) {
    case "EAUTH":
      return `el servidor de correo rechazó las credenciales — revisar SMTP_USER y SMTP_PASS (${mensaje})`;
    case "ETIMEDOUT":
    case "ECONNECTION":
    case "ESOCKET":
    case "ECONNREFUSED":
      return `no se pudo conectar con el servidor de correo — revisar SMTP_HOST, SMTP_PORT y SMTP_SECURE (${mensaje})`;
    case "EENVELOPE":
      return `el servidor rechazó la dirección de destino (${mensaje})`;
    default:
      return mensaje;
  }
}

/**
 * Último fallo de envío por destinatario.
 *
 * Existe por un motivo concreto: better-auth atrapa las excepciones de sus
 * callbacks de correo (`sendResetPassword`, `sendVerificationEmail`) y responde
 * `status: true` igual. Sin este registro, una invitación disparada con el SMTP
 * caído le devuelve "usuario creado" al admin y el problema pasa inadvertido
 * —que es exactamente lo que ocurrió con las invitaciones de agosto de 2026—.
 *
 * Quien dispara el envío lo consume con `tomarFalloDeEnvio()` inmediatamente
 * después, en el mismo request, y así puede informarlo.
 */
const fallosDeEnvio = new Map<string, string>();

/** Tope defensivo: si nadie consume los fallos, el Map no puede crecer sin fin. */
const MAX_FALLOS_RETENIDOS = 100;

/**
 * Lee y descarta el fallo anotado para ese destinatario. Devuelve `undefined`
 * si el último envío salió bien (o si ya se consumió).
 */
export function tomarFalloDeEnvio(to: string): string | undefined {
  const clave = to.trim().toLowerCase();
  const detalle = fallosDeEnvio.get(clave);
  fallosDeEnvio.delete(clave);
  return detalle;
}

function registrarFallo(to: string, detalle: string) {
  if (fallosDeEnvio.size >= MAX_FALLOS_RETENIDOS) {
    fallosDeEnvio.delete(fallosDeEnvio.keys().next().value!);
  }
  fallosDeEnvio.set(to.trim().toLowerCase(), detalle);
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

    // Un envío puede resolver con el destinatario rechazado (el servidor acepta
    // la conexión y descarta la casilla). Sin este chequeo se registraría como
    // "Email enviado" un correo que nunca va a llegar.
    if (info.rejected?.length) {
      throw new Error(`el servidor rechazó al destinatario: ${info.response ?? "sin respuesta"}`);
    }

    // accepted/messageId/response son lo que hace falta para rastrear un envío
    // en los logs del proveedor. Nunca loguear el cuerpo: lleva tokens.
    mailLogger.info(
      { to, subject, messageId: info.messageId, accepted: info.accepted, response: info.response },
      "Email enviado"
    );
    fallosDeEnvio.delete(to.trim().toLowerCase());
    return info;
  } catch (error) {
    const detalle = describirFallo(error);
    registrarFallo(to, detalle);
    mailLogger.error({ error, to, subject, detalle }, "Error al enviar email");
    throw error;
  }
}
