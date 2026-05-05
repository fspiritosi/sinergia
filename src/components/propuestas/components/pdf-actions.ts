"use server";

import prisma from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { PropuestaPDF } from "../pdf/PropuestaPDF";
import { toDateOnlyString } from "@/lib/dates";
import { pdfLogger } from "@/lib/logger";
import { getActiveCondicionesByTipo } from "@/components/condiciones/components/actions";
import { requirePermission } from "@/lib/rbac/require";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function generatePropuestaPDF(propuestaId: string) {
  await requirePermission(PERMISSIONS.PROPUESTAS_DOWNLOAD_PDF);
  try {
    // Obtener la propuesta con sus relaciones
    const propuesta = await prisma.propuestaTecnica.findUnique({
      where: { id: propuestaId },
      include: {
        cliente: true,
        servicios: true,
      },
    });

    if (!propuesta) {
      throw new Error("Propuesta no encontrada");
    }

    // Resolver los items (de array de IDs a objetos completos)
    const itemsFromDb = await prisma.items.findMany({
      where: {
        id: { in: propuesta.items },
        is_active: true,
      },
    });

    // Reordenar items según el orden definido en propuesta.items (drag-and-drop)
    const itemsMap = new Map(itemsFromDb.map((item) => [item.id, item]));
    const items = propuesta.items
      .map((itemId) => itemsMap.get(itemId))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);

    // Obtener condiciones generales desde la base de datos
    const condicionesGenerales = await getActiveCondicionesByTipo("general");

    // Renderizar el PDF a buffer
    const pdfBuffer = await renderToBuffer(
      PropuestaPDF({
        codigo: propuesta.codigo,
        vigencia: propuesta.vigencia
          ? toDateOnlyString(propuesta.vigencia)
          : toDateOnlyString(new Date()),
        clienteNombre: propuesta.cliente.name,
        contacto: propuesta.contacto,
        servicioNombre: propuesta.servicios.name,
        servicioDescripcion: propuesta.servicios.description,
        servicioType: propuesta.servicios.type,
        items,
        valor: Number(propuesta.valor),
        moneda: propuesta.moneda,
        condicionesGenerales: condicionesGenerales.map((c) => c.description),
        condicionesParticulares: propuesta.condicionesParticulares ?? [],
      })
    );

    // Convertir buffer a base64 para retornar desde server action
    const base64 = pdfBuffer.toString("base64");

    return {
      success: true,
      data: base64,
      filename: `PROPUESTA-${propuesta.codigo}.pdf`,
    };
  } catch (error) {
    pdfLogger.error({ error, propuestaId }, "Error al generar PDF de propuesta");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
