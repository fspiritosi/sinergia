import { z } from "zod";

/**
 * PlanTrabajoEstado enum
 */
export const PLAN_TRABAJO_ESTADOS = [
  "pendiente_programacion",
  "programado_incompleto",
  "programado_completo",
  "en_desarrollo",
  "finalizado_con_pendientes",
  "finalizado_completo",
] as const;
export const planTrabajoEstadoEnum = z.enum(PLAN_TRABAJO_ESTADOS);
export type PlanTrabajoEstado = z.infer<typeof planTrabajoEstadoEnum>;

/**
 * ProgramacionPrecision enum
 */
export const PROGRAMACION_PRECISION = ["mes", "dia"] as const;
export const programacionPrecisionEnum = z.enum(PROGRAMACION_PRECISION);
export type ProgramacionPrecision = z.infer<typeof programacionPrecisionEnum>;

/**
 * Base Plan de Trabajo Schema
 * Common validation rules for PlanTrabajo entity
 */
export const planTrabajoBaseSchema = z.object({
  clienteId: z.string().min(1, "Seleccioná un cliente").uuid("ID de cliente inválido"),

  propuestaId: z.string().min(1, "Seleccioná una propuesta").uuid("ID de propuesta inválido"),

  fechaInicio: z.date().or(
    z
      .string()
      .min(1, "La fecha de inicio es requerida")
      .refine((value) => !isNaN(new Date(value).getTime()), {
        message: "Ingresá una fecha válida",
      })
      .transform((value) => new Date(value))
  ),

  fechaFin: z.date().or(
    z
      .string()
      .min(1, "La fecha de fin es requerida")
      .refine((value) => !isNaN(new Date(value).getTime()), {
        message: "Ingresá una fecha válida",
      })
      .transform((value) => new Date(value))
  ),

  estado: planTrabajoEstadoEnum.default("pendiente_programacion"),
});

/**
 * Validation for fechaInicio and fechaFin relationship
 */
export const planTrabajoCreateSchema = planTrabajoBaseSchema.refine(
  (data) => {
    const inicio =
      data.fechaInicio instanceof Date
        ? data.fechaInicio
        : new Date(data.fechaInicio as unknown as string);
    const fin =
      data.fechaFin instanceof Date ? data.fechaFin : new Date(data.fechaFin as unknown as string);
    return inicio <= fin;
  },
  {
    message: "La fecha de inicio debe ser anterior o igual a la fecha de fin",
    path: ["fechaFin"],
  }
);

/**
 * Schema for updating an existing Plan de Trabajo
 */
export const planTrabajoUpdateSchema = planTrabajoBaseSchema.partial().extend({
  id: z.string().uuid("ID de plan de trabajo inválido"),
});

/**
 * Schema for Plan de Trabajo form (client-side)
 */
export const planTrabajoFormSchema = z
  .object({
    clienteId: z.string().min(1, "Seleccioná un cliente"),

    propuestaId: z.string().min(1, "Seleccioná una propuesta"),

    fechaInicio: z
      .string()
      .min(1, "La fecha de inicio es requerida")
      .refine((value) => !isNaN(new Date(value).getTime()), {
        message: "Ingresá una fecha válida",
      }),

    fechaFin: z
      .string()
      .min(1, "La fecha de fin es requerida")
      .refine((value) => !isNaN(new Date(value).getTime()), {
        message: "Ingresá una fecha válida",
      }),

    estado: planTrabajoEstadoEnum.default("pendiente_programacion"),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.fechaInicio);
      const fin = new Date(data.fechaFin);
      return inicio <= fin;
    },
    {
      message: "La fecha de inicio debe ser anterior o igual a la fecha de fin",
      path: ["fechaFin"],
    }
  );

/**
 * Base Plan de Trabajo Programacion Schema
 */
export const planTrabajoProgramacionBaseSchema = z.object({
  planTrabajoId: z.string().uuid("ID de plan de trabajo inválido"),

  itemId: z.string().uuid("ID de item inválido"),

  fechaProgramada: z.date().or(
    z
      .string()
      .min(1, "La fecha programada es requerida")
      .refine((value) => !isNaN(new Date(value).getTime()), {
        message: "Ingresá una fecha válida",
      })
      .transform((value) => new Date(value))
  ),

  precision: programacionPrecisionEnum.default("dia"),

  clientLocationId: z.string().uuid("ID de ubicación inválido").nullable().optional(),

  ejecutadoAt: z
    .date()
    .or(
      z
        .string()
        .refine((value) => !isNaN(new Date(value).getTime()), {
          message: "Ingresá una fecha válida",
        })
        .transform((value) => new Date(value))
    )
    .nullable()
    .optional(),

  adjunto: z.string().url("URL de adjunto inválida").nullable().optional().or(z.literal("")),

  detalleVarianteId: z.string().uuid("ID de detalle variante inválido").nullable().optional(),
});

/**
 * Schema for creating a new Programacion
 */
export const planTrabajoProgramacionCreateSchema = planTrabajoProgramacionBaseSchema;

/**
 * Schema for updating an existing Programacion
 */
export const planTrabajoProgramacionUpdateSchema = planTrabajoProgramacionBaseSchema
  .partial()
  .extend({
    id: z.string().uuid("ID de programación inválido"),
  });

/**
 * Schema for Programacion form (client-side)
 */
export const planTrabajoProgramacionFormSchema = z.object({
  planTrabajoId: z.string().min(1, "Seleccioná un plan de trabajo"),

  itemId: z.string().min(1, "Seleccioná un item"),

  fechaProgramada: z
    .string()
    .min(1, "La fecha programada es requerida")
    .refine((value) => !isNaN(new Date(value).getTime()), {
      message: "Ingresá una fecha válida",
    }),

  precision: programacionPrecisionEnum,

  clientLocationId: z.string().optional().or(z.literal("")),

  ejecutadoAt: z.string().optional().or(z.literal("")),

  adjunto: z.string().optional().or(z.literal("")),

  detalleVarianteId: z.string().optional().or(z.literal("")),
});

/**
 * TypeScript types inferred from schemas
 */
export type PlanTrabajoFormInput = z.infer<typeof planTrabajoFormSchema>;
export type PlanTrabajoCreateInput = z.infer<typeof planTrabajoCreateSchema>;
export type PlanTrabajoUpdateInput = z.infer<typeof planTrabajoUpdateSchema>;

export type PlanTrabajoProgramacionFormInput = z.infer<typeof planTrabajoProgramacionFormSchema>;
export type PlanTrabajoProgramacionCreateInput = z.infer<
  typeof planTrabajoProgramacionCreateSchema
>;
export type PlanTrabajoProgramacionUpdateInput = z.infer<
  typeof planTrabajoProgramacionUpdateSchema
>;

/**
 * Validation helper functions
 */
export const validatePlanTrabajoCreate = (data: unknown) => {
  return planTrabajoCreateSchema.parse(data);
};

export const validatePlanTrabajoUpdate = (data: unknown) => {
  return planTrabajoUpdateSchema.parse(data);
};

export const validatePlanTrabajoForm = (data: unknown) => {
  return planTrabajoFormSchema.parse(data);
};

export const validatePlanTrabajoProgramacionCreate = (data: unknown) => {
  return planTrabajoProgramacionCreateSchema.parse(data);
};

export const validatePlanTrabajoProgramacionUpdate = (data: unknown) => {
  return planTrabajoProgramacionUpdateSchema.parse(data);
};

/**
 * Safe validation helpers (returns { success, data, error })
 */
export const safeValidatePlanTrabajoCreate = (data: unknown) => {
  return planTrabajoCreateSchema.safeParse(data);
};

export const safeValidatePlanTrabajoUpdate = (data: unknown) => {
  return planTrabajoUpdateSchema.safeParse(data);
};

export const safeValidatePlanTrabajoForm = (data: unknown) => {
  return planTrabajoFormSchema.safeParse(data);
};

export const safeValidatePlanTrabajoProgramacionCreate = (data: unknown) => {
  return planTrabajoProgramacionCreateSchema.safeParse(data);
};

export const safeValidatePlanTrabajoProgramacionUpdate = (data: unknown) => {
  return planTrabajoProgramacionUpdateSchema.safeParse(data);
};
