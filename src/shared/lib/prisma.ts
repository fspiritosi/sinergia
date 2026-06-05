/**
 * Re-export del cliente Prisma del proyecto bajo el alias que espera el módulo
 * de Ayuda (taskapp-cli), que importa `{ prisma } from '@/shared/lib/prisma'`.
 * En sinergia el cliente vive en `@/lib/db` como export default.
 */
export { default as prisma } from "@/lib/db";
