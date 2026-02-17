"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    // Note: Cannot use Pino logger here as this is a client component
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Algo salió mal
          </h2>
          <p className="text-muted-foreground max-w-md">
            {error.message || "Ha ocurrido un error inesperado. Por favor, intentá nuevamente."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          <RefreshCw className="mr-2 h-4 w-4" />
          Intentar nuevamente
        </Button>
        <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
