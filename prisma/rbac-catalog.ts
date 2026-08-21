/**
 * Catálogo de roles y permisos del sistema.
 *
 * Fuente de verdad única, compartida por dos consumidores con alcances muy
 * distintos:
 *
 *   - `seed-rbac.ts` reconcilia: deja la base exactamente igual al catálogo,
 *     revocando las asignaciones que no figuren acá. Sirve para levantar un
 *     entorno nuevo, nunca para uno en uso.
 *   - `sync-permissions.ts` sólo da de alta lo que falte y jamás revoca. Es el
 *     que corre en cada arranque del contenedor.
 *
 * Al agregar un permiso nuevo alcanza con sumarlo a `PERMISSIONS`: el sync lo
 * crea y se lo asigna a admin en el próximo deploy. Otorgarlo a otros roles es
 * una decisión de negocio que se toma desde el tablero de roles.
 */

export type RoleSeed = {
  name: string;
  label: string;
  description: string;
  isSystem: boolean;
};

export type PermissionSeed = {
  code: string;
  module: string;
  action: string;
  description: string;
};

export const ROLES: RoleSeed[] = [
  {
    name: "admin",
    label: "Administrador",
    description: "Acceso total al sistema: configuración, usuarios y todas las operaciones.",
    isSystem: true,
  },
  {
    name: "gerente",
    label: "Asistente",
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

export const PERMISSIONS: PermissionSeed[] = [
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
  {
    code: "inspecciones:edit-finalizada",
    module: "inspecciones",
    action: "edit-finalizada",
    description: "Editar inspecciones finalizadas",
  },
];

export const ROLE_PERMISSIONS: Record<string, string[] | "all"> = {
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
