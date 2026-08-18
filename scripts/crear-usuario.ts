/**
 * Alta manual de un usuario, sin pasar por el correo de invitación.
 *
 * Es la vía de escape cuando el envío de mails no funciona: crea el usuario con
 * su rol y una contraseña conocida, que se le comunica por otro canal. El
 * usuario entra directo por /sign-in y puede cambiarla después.
 *
 * Uso:
 *   npx tsx scripts/crear-usuario.ts <email> --rol=tecnico [opciones]
 *
 * Opciones:
 *   --rol=<nombre>       admin | gerente | tecnico | lectura   (obligatorio al crear)
 *   --nombre="Juan Pérez"
 *   --password=<clave>   Si se omite, se genera una y se imprime al final.
 *   --reset              Permite operar sobre un usuario que ya existe:
 *                        le reescribe la contraseña (y el rol, si se pasa --rol).
 *
 * Ejemplos:
 *   npx tsx scripts/crear-usuario.ts ana@empresa.com --rol=tecnico --nombre="Ana Gómez"
 *   npx tsx scripts/crear-usuario.ts ana@empresa.com --reset --password='Temporal.2026'
 *
 * En producción se corre dentro del contenedor de la app, que es quien tiene el
 * DATABASE_URL:
 *   docker exec -it <contenedor> npx tsx scripts/crear-usuario.ts ...
 *
 * Usa Prisma directo en lugar de los repositories, igual que
 * scripts/import-clerk-passwords.ts: es un script de operación, no lógica de
 * aplicación.
 */
import "dotenv/config";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

// El mismo coste que usa la app al hashear (ver auth-server.ts).
const BCRYPT_ROUNDS = 10;

function flag(nombre: string): string | undefined {
  const prefijo = `--${nombre}=`;
  const arg = process.argv.find((a) => a.startsWith(prefijo));
  return arg?.slice(prefijo.length);
}

/**
 * Contraseña temporal legible al dictarla por teléfono: sin caracteres que se
 * confundan (l/1/O/0) ni símbolos que compliquen el copiado.
 */
function generarPassword(): string {
  const alfabeto = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 14; i++) out += alfabeto[randomInt(alfabeto.length)];
  return out;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const reset = process.argv.includes("--reset");
  const rolPedido = flag("rol");
  const nombre = flag("nombre") ?? null;
  const passwordPedida = flag("password");

  if (!email || email.startsWith("--")) {
    console.error(
      "Falta el email.\n  npx tsx scripts/crear-usuario.ts alguien@ejemplo.com --rol=tecnico"
    );
    process.exit(1);
  }

  const existente = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (existente && !reset) {
    console.error(
      `\nYa existe un usuario con ${email} (rol: ${existente.role.name}).\n` +
        `Para reescribirle la contraseña: agregá --reset\n`
    );
    process.exit(1);
  }

  // El rol es obligatorio al crear; en --reset sólo se toca si se pasa.
  let roleId = existente?.roleId;
  if (rolPedido || !existente) {
    if (!rolPedido) {
      const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
      console.error(`\nFalta --rol. Roles disponibles: ${roles.map((r) => r.name).join(", ")}\n`);
      process.exit(1);
    }

    const rol = await prisma.role.findFirst({ where: { name: rolPedido } });
    if (!rol) {
      const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
      console.error(
        `\nNo existe el rol "${rolPedido}". Disponibles: ${roles.map((r) => r.name).join(", ")}\n`
      );
      process.exit(1);
    }
    roleId = rol.id;
  }

  const password = passwordPedida ?? generarPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // El timeout por defecto de una transacción interactiva es de 5 s, que se
  // queda corto cuando el script corre contra una base remota: son varias
  // consultas de ida y vuelta y la latencia se suma.
  await prisma.$transaction(
    async (tx) => {
      const user = existente
        ? await tx.user.update({
            where: { id: existente.id },
            data: {
              roleId,
              // Sin emailVerified, requireEmailVerification le impide entrar.
              emailVerified: true,
              isActive: true,
              ...(nombre ? { name: nombre } : {}),
            },
          })
        : await tx.user.create({
            data: {
              email,
              name: nombre,
              roleId: roleId!,
              emailVerified: true,
              isActive: true,
            },
          });

      // La fila Account con providerId="credential" es la que guarda el hash: sin
      // ella el usuario existe pero no puede iniciar sesión de ninguna forma.
      const cuenta = await tx.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });

      if (cuenta) {
        await tx.account.update({
          where: { id: cuenta.id },
          data: { password: passwordHash },
        });
      } else {
        await tx.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: passwordHash,
          },
        });
      }

      // Las sesiones abiertas quedan inválidas tras cambiar la contraseña: si el
      // --reset es por una credencial comprometida, dejarlas vivas anula el reset.
      if (existente) {
        await tx.session.deleteMany({ where: { userId: user.id } });
      }

      return user;
    },
    { timeout: 30_000 }
  );

  const rolFinal = await prisma.role.findUnique({ where: { id: roleId! } });

  console.log(`\n${existente ? "Usuario actualizado" : "Usuario creado"}: ${email}`);
  console.log(`  rol        : ${rolFinal?.label ?? rolFinal?.name}`);
  if (nombre) console.log(`  nombre     : ${nombre}`);
  console.log(`  contraseña : ${password}`);
  console.log(
    `\nEntra por /sign-in con ese email y contraseña. ` +
      `Comunicásela por un canal seguro y pedile que la cambie.\n`
  );
}

main()
  .catch((error) => {
    console.error("\n✗ Falló:", error?.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
