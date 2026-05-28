import { PrismaClient } from "../src/generated/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();

type RoleSeed = {
  name: string;
  label: string;
  description: string;
  isSystem: boolean;
};

type PermissionSeed = {
  code: string;
  module: string;
  action: string;
  description: string;
};

const ROLES: RoleSeed[] = [
  {
    name: "admin",
    label: "Administrador",
    description: "Acceso total al sistema: configuración, usuarios y todas las operaciones.",
    isSystem: true,
  },
  {
    name: "gerente",
    label: "Gerente",
    description: "Gestiona operativamente planes, planificación e informes. Ve propuestas.",
    isSystem: false,
  },
  {
    name: "tecnico",
    label: "Técnico",
    description: "Ejecuta planificación y carga informes. No accede a configuración ni propuestas.",
    isSystem: false,
  },
  {
    name: "lectura",
    label: "Solo lectura",
    description: "Ve datos operativos sin capacidad de modificar.",
    isSystem: false,
  },
];

const CONFIG_MODULES = [
  "clientes",
  "servicios",
  "items",
  "tipos-informe",
  "tipos-variante",
  "detalles-variante",
  "condiciones",
  "usuarios",
];

function crudPermissions(module: string): PermissionSeed[] {
  return [
    {
      code: `${module}:view`,
      module,
      action: "view",
      description: `Ver ${module}`,
    },
    {
      code: `${module}:create`,
      module,
      action: "create",
      description: `Crear ${module}`,
    },
    {
      code: `${module}:update`,
      module,
      action: "update",
      description: `Editar ${module}`,
    },
    {
      code: `${module}:delete`,
      module,
      action: "delete",
      description: `Eliminar ${module}`,
    },
  ];
}

const PERMISSIONS: PermissionSeed[] = [
  ...CONFIG_MODULES.flatMap(crudPermissions),

  ...crudPermissions("propuestas"),
  {
    code: "propuestas:approve",
    module: "propuestas",
    action: "approve",
    description: "Aprobar propuestas",
  },
  {
    code: "propuestas:reject",
    module: "propuestas",
    action: "reject",
    description: "Rechazar propuestas",
  },
  {
    code: "propuestas:download-pdf",
    module: "propuestas",
    action: "download-pdf",
    description: "Descargar PDF de propuestas",
  },

  ...crudPermissions("planes"),
  {
    code: "planes:schedule",
    module: "planes",
    action: "schedule",
    description: "Programar tareas de planes",
  },
  {
    code: "planes:generate-pdf",
    module: "planes",
    action: "generate-pdf",
    description: "Generar PDF de planes",
  },

  ...crudPermissions("planificacion"),
  {
    code: "planificacion:assign",
    module: "planificacion",
    action: "assign",
    description: "Asignar técnicos a programaciones",
  },

  ...crudPermissions("informes"),
  {
    code: "informes:deliver",
    module: "informes",
    action: "deliver",
    description: "Entregar informes",
  },
  {
    code: "informes:upload-file",
    module: "informes",
    action: "upload-file",
    description: "Subir archivo de informe",
  },
  {
    code: "informes:download-file",
    module: "informes",
    action: "download-file",
    description: "Descargar archivo de informe",
  },

  {
    code: "usuarios:invite",
    module: "usuarios",
    action: "invite",
    description: "Invitar usuarios al sistema",
  },
  {
    code: "usuarios:deactivate",
    module: "usuarios",
    action: "deactivate",
    description: "Desactivar usuarios",
  },
  {
    code: "usuarios:manage-roles",
    module: "usuarios",
    action: "manage-roles",
    description: "Gestionar roles y permisos",
  },

  ...crudPermissions("inspecciones"),
];

const ROLE_PERMISSIONS: Record<string, string[] | "all"> = {
  admin: "all",

  gerente: [
    "clientes:view",
    "propuestas:view",
    "propuestas:download-pdf",
    "planes:view",
    "planes:schedule",
    "planes:generate-pdf",
    "planificacion:view",
    "planificacion:assign",
    "informes:view",
    "informes:create",
    "informes:update",
    "informes:upload-file",
    "informes:download-file",
    "informes:deliver",
    "inspecciones:view",
    "inspecciones:create",
    "inspecciones:update",
  ],

  tecnico: [
    "planes:view",
    "planificacion:view",
    "informes:view",
    "informes:create",
    "informes:update",
    "informes:upload-file",
    "informes:download-file",
    "inspecciones:view",
    "inspecciones:create",
    "inspecciones:update",
  ],

  lectura: [
    "clientes:view",
    "propuestas:view",
    "propuestas:download-pdf",
    "planes:view",
    "planificacion:view",
    "informes:view",
    "inspecciones:view",
  ],
};

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
