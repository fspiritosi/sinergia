/**
 * Importa las contraseñas exportadas de Clerk a las credenciales de better-auth.
 *
 * Clerk hashea con bcrypt y `auth-server.ts` está configurado con
 * `password.verify = bcrypt.compare`, así que el digest se copia tal cual: no
 * se re-hashea nada y los usuarios entran con la misma contraseña de siempre.
 *
 * Uso:
 *   npx tsx scripts/import-clerk-passwords.ts <ruta-al-csv> [--dry-run]
 *
 * El CSV es el export de Clerk Dashboard → Users → Export, con las columnas
 * id, primary_email_address, password_digest, password_hasher.
 *
 * Es idempotente: se puede correr varias veces sin duplicar credenciales.
 *
 * Usa Prisma directo en lugar de los repositories, igual que prisma/seed-rbac.ts:
 * es un script de migración de datos, no lógica de aplicación.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

type ClerkRow = {
  id: string;
  primary_email_address: string;
  password_digest: string;
  password_hasher: string;
};

type Resumen = {
  importados: number;
  yaTenian: number;
  sinUsuario: number;
  sinPassword: number;
  hasherNoSoportado: number;
};

async function main() {
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!csvPath) {
    console.error(
      "Falta la ruta al CSV.\n  npx tsx scripts/import-clerk-passwords.ts <csv> [--dry-run]"
    );
    process.exit(1);
  }

  const rows = parse(readFileSync(csvPath), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as ClerkRow[];

  console.log(`\nLeídas ${rows.length} filas de ${csvPath}${dryRun ? "  (DRY RUN)" : ""}\n`);

  const resumen: Resumen = {
    importados: 0,
    yaTenian: 0,
    sinUsuario: 0,
    sinPassword: 0,
    hasherNoSoportado: 0,
  };

  for (const row of rows) {
    const email = row.primary_email_address?.trim().toLowerCase();
    const clerkId = row.id?.trim();

    // Se busca por clerkId primero porque es exacto; el email es el respaldo
    // para usuarios dados de alta fuera del flujo normal. Nunca se crea un
    // usuario nuevo: si no existe, se informa y se sigue. Crear uno acá le
    // daría un id distinto al que referencian las inspecciones.
    const user =
      (clerkId ? await prisma.user.findUnique({ where: { clerkId } }) : null) ??
      (email ? await prisma.user.findUnique({ where: { email } }) : null);

    if (!user) {
      console.log(`  ⊘ ${email ?? clerkId}: no existe en la base, se omite`);
      resumen.sinUsuario++;
      continue;
    }

    if (!row.password_digest?.trim()) {
      console.log(
        `  ⊘ ${user.email}: sin contraseña en Clerk (¿alta por OAuth?), deberá resetearla`
      );
      resumen.sinPassword++;
      continue;
    }

    if (row.password_hasher?.trim() !== "bcrypt") {
      console.log(`  ⚠ ${user.email}: hasher "${row.password_hasher}" no soportado, se omite`);
      resumen.hasherNoSoportado++;
      continue;
    }

    const yaTiene = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (yaTiene) {
      console.log(`  = ${user.email}: ya tenía credenciales, sin cambios`);
      resumen.yaTenian++;
      continue;
    }

    if (!dryRun) {
      await prisma.$transaction([
        prisma.account.create({
          data: {
            userId: user.id,
            accountId: user.id,
            providerId: "credential",
            password: row.password_digest.trim(),
          },
        }),
        // Con requireEmailVerification activo, un usuario con emailVerified
        // en false no podría entrar. Los de Clerk ya estaban verificados allá.
        prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        }),
      ]);
    }

    console.log(`  ✓ ${user.email}: contraseña importada`);
    resumen.importados++;
  }

  console.log("\n─── Resumen ───");
  console.log(`  Importados            : ${resumen.importados}`);
  console.log(`  Ya tenían credenciales: ${resumen.yaTenian}`);
  console.log(`  Sin usuario en la base: ${resumen.sinUsuario}`);
  console.log(`  Sin contraseña        : ${resumen.sinPassword}`);
  console.log(`  Hasher no soportado   : ${resumen.hasherNoSoportado}`);

  const pendientes = resumen.sinPassword + resumen.hasherNoSoportado;
  if (pendientes > 0) {
    console.log(`\n  ⚠ ${pendientes} usuario(s) tendrán que usar "Olvidé mi contraseña".`);
  }

  // Chequeo de integridad: quien quede sin credenciales no puede entrar.
  const sinCredenciales = await prisma.user.findMany({
    where: { isActive: true, accounts: { none: { providerId: "credential" } } },
    select: { email: true },
  });

  if (sinCredenciales.length > 0) {
    console.log(`\n  ⚠ ${sinCredenciales.length} usuario(s) activos SIN credenciales:`);
    for (const u of sinCredenciales) console.log(`      - ${u.email}`);
  } else {
    console.log("\n  ✓ Todos los usuarios activos tienen credenciales.");
  }

  console.log();
}

main()
  .catch((error) => {
    console.error("Error en el import:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
