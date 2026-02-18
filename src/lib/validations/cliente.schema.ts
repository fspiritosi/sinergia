import { z } from "zod";

/**
 * CUIT validation regex
 * Format: XX-XXXXXXXX-X or XXXXXXXXXXX (11 digits)
 */
const cuitRegex = /^(\d{2}-?\d{8}-?\d{1}|\d{11})$/;

/**
 * Base Cliente Schema
 * Common validation rules for Cliente entity
 */
export const clienteBaseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .trim(),

  cuit: z
    .string()
    .min(11, "El CUIT debe tener al menos 11 caracteres")
    .max(13, "El CUIT no puede exceder 13 caracteres")
    .regex(cuitRegex, "Formato de CUIT inválido (debe ser XX-XXXXXXXX-X)")
    .trim(),

  email: z
    .string()
    .email("Email inválido")
    .max(255, "El email no puede exceder 255 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  telefono: z
    .string()
    .max(50, "El teléfono no puede exceder 50 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  domicilio: z
    .string()
    .max(500, "El domicilio no puede exceder 500 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  provinciaId: z
    .string()
    .min(1, "La provincia es requerida")
    .uuid("ID de provincia inválido")
    .optional()
    .or(z.literal("")),

  ciudadId: z
    .string()
    .min(1, "La ciudad es requerida")
    .uuid("ID de ciudad inválido")
    .optional()
    .or(z.literal("")),

  is_active: z.boolean().optional().default(true),
});

/**
 * Schema for creating a new Cliente
 * All required fields must be present
 */
export const clienteCreateSchema = clienteBaseSchema;

/**
 * Schema for updating an existing Cliente
 * All fields are optional (partial update support)
 */
export const clienteUpdateSchema = clienteBaseSchema.partial().extend({
  id: z.string().uuid("ID de cliente inválido"),
});

/**
 * Schema for Cliente form (client-side)
 * Used in React Hook Form with zodResolver
 */
export const clienteFormSchema = clienteBaseSchema;

/**
 * Schema for Cliente API responses
 * Includes additional fields like id, createdAt, updatedAt
 */
export const clienteResponseSchema = clienteBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

/**
 * TypeScript types inferred from schemas
 */
export type ClienteFormInput = z.infer<typeof clienteFormSchema>;
export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
export type ClienteResponse = z.infer<typeof clienteResponseSchema>;

/**
 * Validation helper functions
 */
export const validateClienteCreate = (data: unknown) => {
  return clienteCreateSchema.parse(data);
};

export const validateClienteUpdate = (data: unknown) => {
  return clienteUpdateSchema.parse(data);
};

export const validateClienteForm = (data: unknown) => {
  return clienteFormSchema.parse(data);
};

/**
 * Safe validation helpers (returns { success, data, error })
 */
export const safeValidateClienteCreate = (data: unknown) => {
  return clienteCreateSchema.safeParse(data);
};

export const safeValidateClienteUpdate = (data: unknown) => {
  return clienteUpdateSchema.safeParse(data);
};

export const safeValidateClienteForm = (data: unknown) => {
  return clienteFormSchema.safeParse(data);
};
