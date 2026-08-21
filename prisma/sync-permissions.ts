import { PrismaClient } from "../src/generated/client";
import { config } from "dotenv";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "./rbac-catalog";

config();

const prisma = new PrismaClient();

/**
 * Sincroniza el catálogo de permisos SIN revocar nada.
 *
 * Corre en cada arranque del contenedor, junto a `prisma migrate deploy`. Las
 * migraciones se ocupan del esquema; esto se ocupa de las filas de RBAC, que
 * son datos y por lo tanto ninguna migración las trae.
 *
 * El catálogo es un PISO, no un espejo:
 *
 *   - Un permiso del catálogo que falte en la base se crea.
 *   - Un rol declarado como "all" recibe todo permiso que le falte.
 *   - Un rol con lista explícita recibe los de su lista que le falten.
 *   - Nada se revoca jamás. Lo que un administrador otorgó a mano desde el
 *     tablero de roles sobrevive intacto.
 *
 * Sin esto, agregar un permiso al catálogo no tiene ningún efecto en un entorno
 * ya desplegado: la fila nunca se crea, `can()` devuelve false para todos —
 * admin incluido — y el tablero de roles tampoco puede otorgarlo, porque lista
 * los permisos que existen en la base. La funcionalidad queda desplegada e
 * invisible.
 */
async function main() {
  console.log("🔐 Sincronizando permisos (modo aditivo)…");

  // Roles faltantes: sólo alta. No se tocan los existentes para no pisar
  // etiquetas o descripciones ajustadas en la base.
  const rolesExistentes = new Set(
    (await prisma.role.findMany({ select: { name: true } })).map((r) => r.name)
  );
  const rolesFaltantes = ROLES.filter((r) => !rolesExistentes.has(r.name));

  if (rolesFaltantes.length > 0) {
    await prisma.role.createMany({ data: rolesFaltantes, skipDuplicates: true });
    console.log(
      `  + ${rolesFaltantes.length} rol(es): ${rolesFaltantes.map((r) => r.name).join(", ")}`
    );
  }

  // Permisos: alta de los que falten, refresco de metadatos de los existentes.
  // Los metadatos (módulo, acción, descripción) son etiquetas del tablero de
  // roles, no asignaciones: refrescarlos no le quita acceso a nadie.
  const codigosExistentes = new Set(
    (await prisma.permission.findMany({ select: { code: true } })).map((p) => p.code)
  );
  const permisosNuevos = PERMISSIONS.filter((p) => !codigosExistentes.has(p.code));

  if (permisosNuevos.length > 0) {
    await prisma.permission.createMany({ data: permisosNuevos, skipDuplicates: true });
    console.log(
      `  + ${permisosNuevos.length} permiso(s): ${permisosNuevos.map((p) => p.code).join(", ")}`
    );
  }

  for (const permiso of PERMISSIONS.filter((p) => codigosExistentes.has(p.code))) {
    await prisma.permission.update({
      where: { code: permiso.code },
      data: {
        module: permiso.module,
        action: permiso.action,
        description: permiso.description,
      },
    });
  }

  const todosLosPermisos = await prisma.permission.findMany({ select: { id: true, code: true } });
  const idPorCodigo = new Map(todosLosPermisos.map((p) => [p.code, p.id]));

  let asignacionesNuevas = 0;

  for (const roleSeed of ROLES) {
    const role = await prisma.role.findUnique({ where: { name: roleSeed.name } });
    if (!role) continue;

    const declarados = ROLE_PERMISSIONS[roleSeed.name];
    const objetivo =
      declarados === "all"
        ? todosLosPermisos.map((p) => p.id)
        : (declarados ?? [])
            .map((code) => idPorCodigo.get(code))
            .filter((id): id is string => Boolean(id));

    const yaAsignados = new Set(
      (
        await prisma.rolePermission.findMany({
          where: { roleId: role.id },
          select: { permissionId: true },
        })
      ).map((rp) => rp.permissionId)
    );

    const aAgregar = objetivo.filter((id) => !yaAsignados.has(id));

    if (aAgregar.length > 0) {
      await prisma.rolePermission.createMany({
        data: aAgregar.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
      asignacionesNuevas += aAgregar.length;
      console.log(`  + ${roleSeed.name}: ${aAgregar.length} asignación(es)`);
    }
  }

  if (permisosNuevos.length === 0 && asignacionesNuevas === 0 && rolesFaltantes.length === 0) {
    console.log("  ✓ Sin cambios: la base ya tiene todo el catálogo");
  }

  console.log("✅ Permisos sincronizados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
