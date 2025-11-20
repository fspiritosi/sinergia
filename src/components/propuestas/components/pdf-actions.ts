"use server"

import prisma from "@/lib/db"
import { renderToBuffer } from '@react-pdf/renderer'
import { PropuestaPDF } from '../pdf/PropuestaPDF'

export async function generatePropuestaPDF(propuestaId: string) {
    try {
        // Obtener la propuesta con sus relaciones
        const propuesta = await prisma.propuestaTecnica.findUnique({
            where: { id: propuestaId },
            include: {
                cliente: true,
                servicios: true,
            },
        })

        if (!propuesta) {
            throw new Error("Propuesta no encontrada")
        }

        // Resolver los items (de array de IDs a objetos completos)
        const items = await prisma.items.findMany({
            where: {
                id: { in: propuesta.items },
                is_active: true,
            },
        })

        // Renderizar el PDF a buffer
        const pdfBuffer = await renderToBuffer(
            PropuestaPDF({
                codigo: propuesta.codigo,
                vigencia: propuesta.vigencia?.toISOString() || new Date().toISOString(),
                clienteNombre: propuesta.cliente.name,
                contacto: propuesta.contacto,
                servicioNombre: propuesta.servicios.name,
                servicioDescripcion: propuesta.servicios.description,
                items,
                valor: Number(propuesta.valor),
                moneda: propuesta.moneda,
            })
        )

        // Convertir buffer a base64 para retornar desde server action
        const base64 = pdfBuffer.toString('base64')

        return {
            success: true,
            data: base64,
            filename: `PROPUESTA-${propuesta.codigo}.pdf`,
        }
    } catch (error) {
        console.error("Error generating PDF:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido",
        }
    }
}
