"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Download, Loader2 } from "lucide-react"
import { generatePropuestaPDF } from "./pdf-actions"
import { toast } from "sonner"

interface PDFViewerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    propuestaId: string
    codigo: string
}

export function PDFViewerDialog({
    open,
    onOpenChange,
    propuestaId,
    codigo,
}: PDFViewerDialogProps) {
    const [pdfData, setPdfData] = useState<string | null>(null)
    const [filename, setFilename] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)

    // Generar PDF cuando se abre el modal
    useEffect(() => {
        console.log(open, 'open')
        console.log(pdfData, 'pdfData')
        if (open && !pdfData) {
            handleGeneratePDF()
        }
    })

    const handleGeneratePDF = async () => {
        setIsLoading(true)
        try {
            console.log(propuestaId, 'propuestaId')
            const result = await generatePropuestaPDF(propuestaId)
            console.log(result, 'result')

            if (result.success && result.data) {
                setPdfData(result.data)
                setFilename(result.filename)
            } else {
                toast.error(result.error || "Error al generar PDF")
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Error:", error)
            toast.error("Error al generar PDF")
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = () => {
        if (!pdfData) return

        // Convertir base64 a blob
        const byteCharacters = atob(pdfData)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })

        // Crear link de descarga
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        link.click()
        window.URL.revokeObjectURL(url)

        toast.success("PDF descargado correctamente")
    }

    // Limpiar al cerrar
    const handleClose = () => {
        setPdfData(null)
        setFilename("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Vista Previa - Propuesta {codigo}</DialogTitle>
                    <DialogDescription>
                        Visualiza el PDF antes de descargarlo
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-gray-100">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Generando PDF...</p>
                            </div>
                        </div>
                    ) : pdfData ? (
                        <iframe
                            src={`data:application/pdf;base64,${pdfData}`}
                            className="w-full h-full"
                            title="PDF Preview"
                        />
                    ) : null}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={!pdfData || isLoading}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
