/**
 * Verifica la configuración SMTP enviando un correo real.
 *
 * Útil antes de un cutover o al cambiar de proveedor de correo: comprueba que
 * el host responde, que las credenciales autentican y que el mensaje sale.
 *
 * Uso:
 *   npx tsx scripts/probar-smtp.ts destinatario@ejemplo.com
 *
 * Arma el transporte con las mismas variables que src/lib/mailer.ts en lugar de
 * importarlo: ese módulo está marcado `server-only` y no se puede cargar desde
 * un script suelto. Lo que se valida acá es la configuración, que es
 * justamente lo que suele fallar al mover el correo de un proveedor a otro.
 */
import { loadEnvConfig } from "@next/env";
import nodemailer from "nodemailer";

loadEnvConfig(process.cwd(), true);

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`Falta la variable ${nombre} en el entorno.`);
    process.exit(1);
  }
  return valor;
}

async function main() {
  const destino = process.argv[2];

  if (!destino) {
    console.error("Falta el destinatario.\n  npx tsx scripts/probar-smtp.ts alguien@ejemplo.com");
    process.exit(1);
  }

  const host = requerida("SMTP_HOST");
  const port = Number(requerida("SMTP_PORT"));
  const user = requerida("SMTP_USER");
  const pass = requerida("SMTP_PASS");
  const from = requerida("SMTP_FROM");
  const secure = process.env.SMTP_SECURE !== "false";

  console.log(`\nServidor : ${host}:${port} (secure: ${secure})`);
  console.log(`Usuario  : ${user}`);
  console.log(`From     : ${from}`);
  console.log(`Para     : ${destino}\n`);

  const transporte = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  process.stdout.write("Autenticando… ");
  await transporte.verify();
  console.log("OK");

  process.stdout.write("Enviando… ");
  const info = await transporte.sendMail({
    from,
    to: destino,
    subject: "Prueba de envío — Sinergia Ambiental",
    text:
      "Prueba de configuración SMTP.\n\n" +
      "Si estás leyendo esto, el envío de correos de Sinergia Ambiental quedó funcionando. " +
      "Por este canal salen las invitaciones de usuarios, la verificación de email y " +
      "los enlaces para restablecer la contraseña.",
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
        <h1 style="font-size:20px;margin:0 0 16px">Prueba de configuración SMTP</h1>
        <p style="margin:0 0 16px">
          Si estás leyendo esto, el envío de correos de Sinergia Ambiental quedó funcionando.
        </p>
        <p style="margin:0 0 16px">
          Por este mismo canal van a salir las invitaciones de usuarios, la
          verificación de email y los enlaces para restablecer la contraseña.
        </p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
        <p style="font-size:12px;color:#666;margin:0">Mensaje de prueba automático.</p>
      </div>`,
  });

  console.log("OK\n");
  console.log(`  messageId : ${info.messageId}`);
  if (info.accepted?.length) console.log(`  aceptado  : ${info.accepted.join(", ")}`);
  if (info.rejected?.length) console.log(`  RECHAZADO : ${info.rejected.join(", ")}`);
  console.log(`  respuesta : ${info.response}`);
  console.log();
}

main().catch((error) => {
  console.error("\n✗ Falló:", error?.message ?? error);
  if (error?.code) console.error("  código:", error.code);
  process.exit(1);
});
