import { Document } from '@react-pdf/renderer'
import { PortadaPage } from './PortadaPage'
import { OfertaEconomicaPage } from './OfertaEconomicaPage'
import type { Items, Moneda } from '@/generated/client'

interface PropuestaPDFProps {
    codigo: string
    vigencia: string
    clienteNombre: string
    contacto?: string | null
    servicioNombre: string
    servicioDescripcion: string
    items: Items[]
    valor: number
    moneda: Moneda
}

export function PropuestaPDF({
    codigo,
    vigencia,
    clienteNombre,
    contacto,
    servicioNombre,
    servicioDescripcion,
    items,
    valor,
    moneda,
}: PropuestaPDFProps) {
    return (
        <Document
            title={`Propuesta ${codigo}`}
            author="Sinergia Ambiental"
            subject="Oferta Técnica Económica"
            creator="Sinergia Management System"
        >
            <PortadaPage
                codigo={codigo}
                vigencia={vigencia}
                clienteNombre={clienteNombre}
                contacto={contacto}
                servicioDescripcion={servicioDescripcion}
                items={items}
            />

            <OfertaEconomicaPage
                servicioDescripcion={servicioDescripcion}
                servicioNombre={servicioNombre}
                items={items}
                valor={valor}
                moneda={moneda}
            />
        </Document>
    )
}
