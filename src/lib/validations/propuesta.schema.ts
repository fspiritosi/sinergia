import { z } from "zod";

/**
 * Moneda enum
 */
export const MONEDAS = ["ARS", "USD", "EUR"] as const;
export const monedaEnum = z.enum(MONEDAS);
export type Moneda = z.infer<typeof monedaEnum>;

/**
 * PropuestaStatus enum
 */
export const PROPUESTA_STATUS = [
  "pendiente",
  "aprobada",
  "rechazada",
  "en_progreso",
  "finalizada",
] as const;
export const propuestaStatusEnum = z.enum(PROPUESTA_STATUS);
export type PropuestaStatus = z.infer<typeof propuestaStatusEnum>;

/**
 * Base Propuesta Técnica Schema
 * Common validation rules for PropuestaTecnica entity
 */
export const propuestaBaseSchema = z.object({
  codigo: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "El código no puede exceder 50 caracteres")
    .trim(),

  clienteId: z.string().min(1, "Seleccioná un cliente").uuid("ID de cliente inválido"),

  servicioId: z.string().min(1, "Seleccioná un servicio").uuid("ID de servicio inválido"),

  vigencia: z
    .date()
    .or(
      z
        .string()
        .min(1, "La vigencia es requerida")
        .refine((value) => !isNaN(new Date(value).getTime()), {
          message: "Ingresá una fecha válida",
        })
        .transform((value) => new Date(value))
    )
    .nullable()
    .optional(),

  items: z.array(z.string()).min(1, "Seleccioná al menos un item").default([]),

  contacto: z
    .string()
    .max(255, "El contacto no puede exceder 255 caracteres")
    .trim()
    .optional()
    .or(z.literal(""))
    .nullable(),

  valor: z
    .number()
    .nonnegative("El valor debe ser mayor o igual a 0")
    .or(
      z
        .string()
        .min(1, "El valor es requerido")
        .refine((value) => !isNaN(Number(value)), {
          message: "Ingresá un número válido",
        })
        .refine((value) => Number(value) >= 0, {
          message: "El valor debe ser mayor o igual a 0",
        })
        .transform((value) => Number(value))
    ),

  moneda: monedaEnum.default("ARS"),

  status: propuestaStatusEnum.default("pendiente"),

  condicionesParticulares: z
    .array(z.string())
    .min(1, "Seleccioná al menos una condición particular")
    .default([]),

  is_active: z.boolean().default(true),
});

/**
 * Schema for creating a new Propuesta
 * All required fields must be present
 */
export const propuestaCreateSchema = propuestaBaseSchema;

/**
 * Schema for updating an existing Propuesta
 * All fields are optional (partial update support)
 */
export const propuestaUpdateSchema = propuestaBaseSchema.partial().extend({
  id: z.string().uuid("ID de propuesta inválido"),
});

/**
 * Schema for Propuesta form (client-side)
 * Used in React Hook Form with zodResolver
 * Keeps vigencia as string for easier form handling
 */
export const propuestaFormSchema = z.object({
  codigo: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "El código no puede exceder 50 caracteres")
    .trim(),

  clienteId: z.string().min(1, "Seleccioná un cliente"),

  servicioId: z.string().min(1, "Seleccioná un servicio"),

  vigencia: z
    .string()
    .min(1, "La vigencia es requerida")
    .refine((value) => !isNaN(new Date(value).getTime()), {
      message: "Ingresá una fecha válida",
    }),

  items: z.array(z.string()).min(1, "Seleccioná al menos un item").default([]),

  contacto: z.string().optional().or(z.literal("")),

  valor: z
    .string()
    .min(1, "El valor es requerido")
    .refine((value) => !isNaN(Number(value)), {
      message: "Ingresá un número válido",
    })
    .refine((value) => Number(value) >= 0, {
      message: "El valor debe ser mayor o igual a 0",
    }),

  moneda: monedaEnum,

  status: propuestaStatusEnum,

  condicionesParticulares: z
    .array(z.string())
    .min(1, "Seleccioná al menos una condición particular"),
});

/**
 * Schema for Propuesta API responses
 */
export const propuestaResponseSchema = propuestaBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

/**
 * TypeScript types inferred from schemas
 */
export type PropuestaFormInput = z.infer<typeof propuestaFormSchema>;
export type PropuestaCreateInput = z.infer<typeof propuestaCreateSchema>;
export type PropuestaUpdateInput = z.infer<typeof propuestaUpdateSchema>;
export type PropuestaResponse = z.infer<typeof propuestaResponseSchema>;

/**
 * Validation helper functions
 */
export const validatePropuestaCreate = (data: unknown) => {
  return propuestaCreateSchema.parse(data);
};

export const validatePropuestaUpdate = (data: unknown) => {
  return propuestaUpdateSchema.parse(data);
};

export const validatePropuestaForm = (data: unknown) => {
  return propuestaFormSchema.parse(data);
};

/**
 * Safe validation helpers (returns { success, data, error })
 */
export const safeValidatePropuestaCreate = (data: unknown) => {
  return propuestaCreateSchema.safeParse(data);
};

export const safeValidatePropuestaUpdate = (data: unknown) => {
  return propuestaUpdateSchema.safeParse(data);
};

export const safeValidatePropuestaForm = (data: unknown) => {
  return propuestaFormSchema.safeParse(data);
};
