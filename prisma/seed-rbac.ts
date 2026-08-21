import { PrismaClient } from "../src/generated/client";
import { config } from "dotenv";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "./rbac-catalog";

config();

const prisma = new PrismaClient();

/**
 * ATENCIÓN: este seed RECONCILIA. Deja cada rol con exactamente los permisos
 * que declara `ROLE_PERMISSIONS`, revocando todo lo que se haya otorgado a mano
 * desde el tablero de roles.
 *
 * Es para levantar un entorno nuevo. Contra un entorno en uso, usar
 * `sync-permissions.ts`, que sólo agrega lo que falta.
 */
async function main() {
  console.log("🌱 Seeding RBAC…");

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        label: role.label,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }
  console.log(`  ✓ ${ROLES.length} roles listos`);

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permisos listos`);

  const allPermissions = await prisma.permission.findMany();
  const byCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const roleSeed of ROLES) {
    const role = await prisma.role.findUniqueOrThrow({
      where: { name: roleSeed.name },
    });

    const allowed = ROLE_PERMISSIONS[roleSeed.name];
    const targetPermissionIds =
      allowed === "all"
        ? allPermissions.map((p) => p.id)
        : (allowed ?? []).map((code) => {
            const id = byCode.get(code);
            if (!id) throw new Error(`Permission code not found: ${code}`);
            return id;
          });

    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((e) => e.permissionId));
    const targetIds = new Set(targetPermissionIds);

    const toAdd = targetPermissionIds.filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !targetIds.has(id));

    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: { in: toRemove },
        },
      });
    }

    console.log(
      `  ✓ ${roleSeed.name}: ${targetIds.size} permisos (+${toAdd.length} / -${toRemove.length})`
    );
  }

  console.log("✅ RBAC seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
