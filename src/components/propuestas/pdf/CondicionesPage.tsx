import { Page, View, Text, Image } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { PageFooter } from './PageFooter'
import { CONSIDERACIONES_GENERALES } from '@/lib/pdf-constants'
import type { Items, Moneda, PropuestaTecnica } from '@/generated/client'

interface CondicionesPageProps {
    servicioDescripcion: string
    servicioNombre: string
    items: Items[]
    valor: number
    moneda: Moneda
    condicionesParticulares?: PropuestaTecnica['condicionesParticulares']
}

export function CondicionesPage({
    servicioDescripcion,
    condicionesParticulares = [],
}: CondicionesPageProps) {
    return (
        <Page size="A4" style={pdfStyles.portadaPage}>
            {/* Sección Barra | Logo | Descripción - crecen juntas */}
            <View style={pdfStyles.headerContent}>
                <View style={pdfStyles.verticalBar} />
                <View style={pdfStyles.logoContainer}>
                    <Image
                        src="https://pub-f585ac1b3c1f462c8439adaf03fa21cd.r2.dev/LogoVertical.jpg"
                        style={pdfStyles.logo}
                    />
                </View>
                <View style={pdfStyles.serviceDescription}>
                    <Text style={pdfStyles.serviceTitle}>Descripción del Servicio:</Text>
                    <Text style={pdfStyles.serviceText}>{servicioDescripcion}</Text>
                </View>
            </View>

            {/* Contenedor principal de 2 columnas que ocupa todo el espacio hasta el footer */}
            <View style={pdfStyles.portadaBody}>
                {/* Columna izquierda: Sidebar vacío */}
                {/* <View style={pdfStyles.portadaSidebar} /> */}

                {/* Columna derecha: Contenido principal - Consideraciones */}
                <View style={pdfStyles.conditionsMainContent}>
                    {/* Consideraciones Generales */}
                    <Text style={pdfStyles.consideracionesTitle}>Consideraciones Generales</Text>
                    {CONSIDERACIONES_GENERALES.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <View style={pdfStyles.bulletPoint} />
                            <Text style={[pdfStyles.consideracion, { flex: 1, paddingLeft: 0 }]}>
                                {item}
                            </Text>
                        </View>
                    ))}

                    {/* Consideraciones Particulares */}
                    <Text style={[pdfStyles.consideracionesTitle, { marginTop: 15 }]}>Consideraciones Particulares</Text>
                    {condicionesParticulares.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <View style={pdfStyles.bulletPoint} />
                            <Text style={[pdfStyles.consideracion, { flex: 1, paddingLeft: 0 }]}>
                                {item}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <PageFooter />
        </Page>
    )
}
