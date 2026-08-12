import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

// Helpers específicos por módulo
export const dbLogger = logger.child({ module: "database" });
export const authLogger = logger.child({ module: "auth" });
export const pdfLogger = logger.child({ module: "pdf" });
export const apiLogger = logger.child({ module: "api" });
export const uploadLogger = logger.child({ module: "upload" });
export const mailLogger = logger.child({ module: "mail" });

type LogMeta = { data?: unknown };

/**
 * Logger con scope, compatible con la convención del módulo de Ayuda (taskapp-cli).
 * Envuelve el logger pino del proyecto: el `scope` se mapea a `module` y `meta.data`
 * se loguea como contexto estructurado. Mantiene la regla del proyecto de usar pino.
 */
export class Logger {
  private readonly base: pino.Logger;

  constructor(scope?: string) {
    this.base = scope ? logger.child({ module: scope }) : logger;
  }

  debug(message: string, meta?: LogMeta) {
    this.base.debug(meta?.data ?? {}, message);
  }

  info(message: string, meta?: LogMeta) {
    this.base.info(meta?.data ?? {}, message);
  }

  warn(message: string, meta?: LogMeta) {
    this.base.warn(meta?.data ?? {}, message);
  }

  error(message: string, meta?: LogMeta) {
    this.base.error(meta?.data ?? {}, message);
  }
}
