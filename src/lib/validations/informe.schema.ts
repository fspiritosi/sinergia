import { z } from "zod";

/**
 * Validación para la edición de un Informe.
 * Solo se permite editar informes que NO estén entregados (ver informe-guards).
 */
export const informeUpdateSchema = z.object({
  tipoDeInformeId: z.string().uuid("Tipo de informe inválido"),
  clientLocationId: z.string().uuid("Locación inválida"),
  responsableConfeccion: z.string().max(200).optional().default(""),
  fechaVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de vencimiento es inválida"),
});

export type InformeUpdateInput = z.infer<typeof informeUpdateSchema>;

export function validateInformeUpdate(data: unknown): InformeUpdateInput {
  return informeUpdateSchema.parse(data);
}
