/**
 * Reasigna support_ticket_views.user_id de clerkId a User.id.
 *
 * Esa tabla guarda qué tickets de soporte vio cada usuario, y su `user_id` es
 * texto libre sin FK: hasta la migración guardaba el id crudo de Clerk
 * (`user_xxx`), porque `getReporterEmail()` devolvía `currentUser().id`. Ahora
 * devuelve `User.id` (uuid), así que sin este backfill las filas viejas quedan
 * huérfanas y esos tickets vuelven a aparecer como no leídos.
 *
 * Es cosmético, pero hay que correrlo ANTES de eliminar la columna clerkId:
 * después ya no habría forma de mapear un id con el otro.
 *
 * Uso:
 *   npx tsx scripts/migrate-support-ticket-views.ts [--dry-run]
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const usuarios = await prisma.user.findMany({
    where: { clerkId: { not: null } },
    select: { id: true, clerkId: true, email: true },
  });

  if (usuarios.length === 0) {
    console.log("\nNingún usuario conserva clerkId: o ya se migró, o no hace falta.\n");
    return;
  }

  console.log(`\n${usuarios.length} usuario(s) con clerkId${dryRun ? "  (DRY RUN)" : ""}\n`);

  let total = 0;

  for (const u of usuarios) {
    const filas = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*)::bigint AS n FROM support_ticket_views WHERE user_id = ${u.clerkId}
    `;
    const n = Number(filas[0]?.n ?? 0);
    if (n === 0) continue;

    if (!dryRun) {
      await prisma.$executeRaw`
        UPDATE support_ticket_views SET user_id = ${u.id} WHERE user_id = ${u.clerkId}
      `;
    }

    console.log(`  ✓ ${u.email}: ${n} fila(s) reasignadas`);
    total += n;
  }

  // Lo que queda con formato user_xxx no matcheó con ningún usuario: son
  // vistas de cuentas ya borradas. No se tocan.
  const residuo = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(*)::bigint AS n FROM support_ticket_views WHERE user_id LIKE 'user\\_%'
  `;
  const huerfanas = Number(residuo[0]?.n ?? 0);

  console.log(`\n─── Resumen ───`);
  console.log(`  Filas reasignadas : ${total}`);
  console.log(
    `  Sin dueño (quedan): ${huerfanas}${huerfanas > 0 ? "  (usuarios eliminados)" : ""}`
  );
  console.log();
}

main()
  .catch((error) => {
    console.error("Error en el backfill:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
