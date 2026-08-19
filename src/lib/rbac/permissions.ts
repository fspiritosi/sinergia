export const PERMISSIONS = {
  // Configuración — solo admin
  CLIENTES_VIEW: "clientes:view",
  CLIENTES_CREATE: "clientes:create",
  CLIENTES_UPDATE: "clientes:update",
  CLIENTES_DELETE: "clientes:delete",

  SERVICIOS_VIEW: "servicios:view",
  SERVICIOS_CREATE: "servicios:create",
  SERVICIOS_UPDATE: "servicios:update",
  SERVICIOS_DELETE: "servicios:delete",

  ITEMS_VIEW: "items:view",
  ITEMS_CREATE: "items:create",
  ITEMS_UPDATE: "items:update",
  ITEMS_DELETE: "items:delete",

  TIPOS_INFORME_VIEW: "tipos-informe:view",
  TIPOS_INFORME_CREATE: "tipos-informe:create",
  TIPOS_INFORME_UPDATE: "tipos-informe:update",
  TIPOS_INFORME_DELETE: "tipos-informe:delete",

  TIPOS_VARIANTE_VIEW: "tipos-variante:view",
  TIPOS_VARIANTE_CREATE: "tipos-variante:create",
  TIPOS_VARIANTE_UPDATE: "tipos-variante:update",
  TIPOS_VARIANTE_DELETE: "tipos-variante:delete",

  DETALLES_VARIANTE_VIEW: "detalles-variante:view",
  DETALLES_VARIANTE_CREATE: "detalles-variante:create",
  DETALLES_VARIANTE_UPDATE: "detalles-variante:update",
  DETALLES_VARIANTE_DELETE: "detalles-variante:delete",

  CONDICIONES_VIEW: "condiciones:view",
  CONDICIONES_CREATE: "condiciones:create",
  CONDICIONES_UPDATE: "condiciones:update",
  CONDICIONES_DELETE: "condiciones:delete",

  USUARIOS_VIEW: "usuarios:view",
  USUARIOS_CREATE: "usuarios:create",
  USUARIOS_UPDATE: "usuarios:update",
  USUARIOS_DELETE: "usuarios:delete",
  USUARIOS_INVITE: "usuarios:invite",
  USUARIOS_DEACTIVATE: "usuarios:deactivate",
  USUARIOS_MANAGE_ROLES: "usuarios:manage-roles",

  // Propuestas
  PROPUESTAS_VIEW: "propuestas:view",
  PROPUESTAS_CREATE: "propuestas:create",
  PROPUESTAS_UPDATE: "propuestas:update",
  PROPUESTAS_DELETE: "propuestas:delete",
  PROPUESTAS_APPROVE: "propuestas:approve",
  PROPUESTAS_REJECT: "propuestas:reject",
  PROPUESTAS_DOWNLOAD_PDF: "propuestas:download-pdf",

  // Planes
  PLANES_VIEW: "planes:view",
  PLANES_CREATE: "planes:create",
  PLANES_UPDATE: "planes:update",
  PLANES_DELETE: "planes:delete",
  PLANES_SCHEDULE: "planes:schedule",
  PLANES_GENERATE_PDF: "planes:generate-pdf",

  // Planificacion
  PLANIFICACION_VIEW: "planificacion:view",
  PLANIFICACION_CREATE: "planificacion:create",
  PLANIFICACION_UPDATE: "planificacion:update",
  PLANIFICACION_DELETE: "planificacion:delete",
  PLANIFICACION_ASSIGN: "planificacion:assign",

  // Informes
  INFORMES_VIEW: "informes:view",
  INFORMES_CREATE: "informes:create",
  INFORMES_UPDATE: "informes:update",
  INFORMES_DELETE: "informes:delete",
  INFORMES_DELIVER: "informes:deliver",
  INFORMES_UPLOAD_FILE: "informes:upload-file",
  INFORMES_DOWNLOAD_FILE: "informes:download-file",

  // Inspecciones
  INSPECCIONES_VIEW: "inspecciones:view",
  INSPECCIONES_CREATE: "inspecciones:create",
  INSPECCIONES_UPDATE: "inspecciones:update",
  INSPECCIONES_DELETE: "inspecciones:delete",
  INSPECCIONES_EDIT_FINALIZADA: "inspecciones:edit-finalizada",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  ADMIN: "admin",
  GERENTE: "gerente",
  TECNICO: "tecnico",
  LECTURA: "lectura",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
