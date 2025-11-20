import { Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { PageHeader } from './PageHeader'
import { PageFooter } from './PageFooter'
import { CONSIDERACIONES_GENERALES, NOTAS_PIE } from '@/lib/pdf-constants'
import type { Items, Moneda } from '@/generated/client'

interface OfertaEconomicaPageProps {
    servicioDescripcion: string
    servicioNombre: string
    items: Items[]
    valor: number
    moneda: Moneda
}

export function OfertaEconomicaPage({
    servicioDescripcion,
    servicioNombre,
    items,
    valor,
    moneda,
}: OfertaEconomicaPageProps) {
    return (
        <Page size="A4" style={pdfStyles.page}>
            <PageHeader serviceDescription={servicioDescripcion} />

            <View style={pdfStyles.content}>
                {/* Consideraciones Generales */}
                <View style={pdfStyles.consideracionesSection}>
                    <Text style={pdfStyles.consideracionesTitle}>Consideraciones Generales</Text>
                    {CONSIDERACIONES_GENERALES.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <View style={pdfStyles.bulletPoint} />
                            <Text style={[pdfStyles.consideracion, { flex: 1, paddingLeft: 0 }]}>
                                {item}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Oferta Económica */}
                <View>
                    <View style={[pdfStyles.titleDivider, { alignSelf: 'flex-start', marginLeft: 20 }]} />
                    <Text style={[pdfStyles.sectionTitle, { textAlign: 'left', marginLeft: 20 }]}>Oferta Económica</Text>

                    <View style={pdfStyles.offerContainer}>
                        {/* Header Row */}
                        <View style={pdfStyles.offerRow}>
                            <View style={[pdfStyles.offerHeaderBox, pdfStyles.offerBoxLeft]}>
                                <Text style={pdfStyles.offerHeaderText}>Detalle del servicio</Text>
                            </View>
                            <View style={[pdfStyles.offerHeaderBox, pdfStyles.offerBoxRight]}>
                                <Text style={pdfStyles.offerHeaderText}>Costo mensual ($ {moneda})</Text>
                            </View>
                        </View>

                        {/* Value Row with Gradient */}
                        <View style={pdfStyles.offerRow}>
                            {/* Left Box - Service Name */}
                            <View style={[pdfStyles.offerValueBox, pdfStyles.offerBoxLeft, { backgroundColor: '#2398A1' }]}>
                                {/* Note: react-pdf might not support linear-gradient in style prop directly for View. 
                                    We might need to use a background color or an image. 
                                    Let's try to simulate or just use the primary color for now as requested "gradient from blue to green".
                                    If react-pdf supports it: style={{ background: 'linear-gradient(90deg, #2398A1, #84B631)' }} 
                                */}
                                <Text style={pdfStyles.offerValueText}>
                                    {servicioNombre}
                                </Text>
                            </View>

                            {/* Right Box - Value */}
                            <View style={[pdfStyles.offerValueBox, pdfStyles.offerBoxRight, { backgroundColor: '#84B631' }]}>
                                <Text style={pdfStyles.offerValueTextRight}>
                                    {valor.toLocaleString('es-AR', {
                                        style: 'currency',
                                        currency: moneda,
                                    })}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Notas al pie */}
                    <View style={pdfStyles.notasSection}>
                        {NOTAS_PIE.map((nota, index) => (
                            <Text key={index} style={pdfStyles.nota}>
                                {nota}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>

            <PageFooter />
        </Page>
    )
}
