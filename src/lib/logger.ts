import pino from "pino"

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
})

// Helpers específicos por módulo
export const dbLogger = logger.child({ module: "database" })
export const authLogger = logger.child({ module: "auth" })
export const pdfLogger = logger.child({ module: "pdf" })
export const apiLogger = logger.child({ module: "api" })
export const uploadLogger = logger.child({ module: "upload" })
