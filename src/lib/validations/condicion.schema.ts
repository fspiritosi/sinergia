import { z } from "zod";
import { CondicionTipo } from "@/generated/client";

export const condicionBaseSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100).trim(),
  description: z.string().min(1, "La descripción es requerida").max(1000).trim(),
  tipo: z.nativeEnum(CondicionTipo),
  category: z.string().optional(),
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const condicionCreateSchema = condicionBaseSchema;
export const condicionUpdateSchema = condicionBaseSchema.extend({
  id: z.string().uuid(),
});

export type CondicionCreateInput = z.infer<typeof condicionCreateSchema>;
export type CondicionUpdateInput = z.infer<typeof condicionUpdateSchema>;

export function validateCondicionCreate(data: unknown) {
  return condicionCreateSchema.parse(data);
}

export function validateCondicionUpdate(data: unknown) {
  return condicionUpdateSchema.parse(data);
}
