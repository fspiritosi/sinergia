"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth-server";
import { authLogger, uploadLogger } from "@/lib/logger";
import { deleteFileFromR2, uploadFileToR2 } from "@/lib/r2-upload";
import { perfilSchema, validarArchivoAvatar } from "@/lib/validations/cuenta.schema";

/**
 * Acciones de "Mi cuenta": lo que un usuario cambia de sí mismo.
 *
 * A diferencia del resto de las actions del proyecto, acá **no** se llama a
 * `requirePermission()`. No hay un permiso del RBAC que gobierne esto: el
 * control de acceso es que el usuario editado es el de la sesión, y eso lo
 * garantiza `sesionActual()` — nunca se recibe un userId por parámetro.
 */
async function sesionActual() {
  const cabeceras = await headers();
  const session = await auth.api.getSession({ headers: cabeceras });

  if (!session?.user?.id) {
    throw new Error("No hay sesión activa");
  }

  return { user: session.user, cabeceras };
}

/** Prefijo de las keys de avatar en R2. Sirve para no borrar otra cosa. */
const AVATAR_PREFIX = "avatars/";

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sube la foto de perfil y la deja apuntada en `User.image`.
 *
 * Guarda la **key** de R2, no una URL: el bucket no es público (sólo lo son los
 * logos), así que la imagen se sirve por `/api/usuarios/avatar/[id]`. Es el
 * mismo patrón que usan inspecciones e informes.
 *
 * La escritura en la base la hace better-auth y no Prisma directo, para que la
 * sesión quede coherente: escribiendo por afuera, `useSession()` seguiría
 * devolviendo la foto anterior hasta el próximo refetch.
 */
export async function updateAvatarAction(formData: FormData): Promise<{ imageKey: string }> {
  const { user, cabeceras } = await sesionActual();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No se recibió ninguna imagen");
  }

  const problema = validarArchivoAvatar({ type: file.type, size: file.size });
  if (problema) {
    throw new Error(problema);
  }

  const anterior = typeof user.image === "string" ? user.image : null;
  const extension = EXTENSION_POR_TIPO[file.type] ?? "jpg";
  const key = `${AVATAR_PREFIX}${user.id}-${Date.now()}.${extension}`;

  try {
    await uploadFileToR2(file, key);

    await auth.api.updateUser({
      body: { image: key },
      headers: cabeceras,
    });

    // Recién se borra la anterior cuando la nueva ya quedó referenciada: al
    // revés, un fallo en el medio dejaría al usuario sin foto y sin archivo.
    if (anterior?.startsWith(AVATAR_PREFIX) && anterior !== key) {
      await deleteFileFromR2(anterior).catch((error) => {
        // Que quede un huérfano en R2 no justifica fallarle al usuario: la foto
        // nueva ya está guardada y funcionando.
        uploadLogger.warn({ error, key: anterior }, "No se pudo borrar el avatar anterior");
      });
    }

    uploadLogger.info({ userId: user.id, key }, "Avatar actualizado");
    revalidatePath("/dashboard");

    return { imageKey: key };
  } catch (error: unknown) {
    uploadLogger.error({ error, userId: user.id }, "Error al actualizar el avatar");
    throw error instanceof Error ? error : new Error("Error al subir la foto");
  }
}

/** Cambia el nombre visible del usuario. */
export async function updateProfileAction(data: { name: string }): Promise<void> {
  const { user, cabeceras } = await sesionActual();

  const parsed = perfilSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  try {
    await auth.api.updateUser({
      body: { name: parsed.data.name },
      headers: cabeceras,
    });

    authLogger.info({ userId: user.id }, "Perfil actualizado");
    revalidatePath("/dashboard");
  } catch (error: unknown) {
    authLogger.error({ error, userId: user.id }, "Error al actualizar el perfil");
    throw error instanceof Error ? error : new Error("Error al guardar el perfil");
  }
}
