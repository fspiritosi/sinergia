import { Page, View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { PageHeader } from './PageHeader'
import { PageFooter } from './PageFooter'
import { CONSIDERACIONES_GENERALES, NOTAS_PIE } from '@/lib/pdf-constants'
import type { Items, Moneda, PropuestaTecnica } from '@/generated/client'

interface OfertaEconomicaPageProps {
    servicioDescripcion: string
    servicioNombre: string
    items: Items[]
    valor: number
    moneda: Moneda
    condicionesParticulares?: PropuestaTecnica['condicionesParticulares']
}

export function CondicionesPage({
    servicioDescripcion,
    servicioNombre,
    items,
    valor,
    moneda,
    condicionesParticulares = [],
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
                  {/* Consideraciones Particulares */}
                <View style={pdfStyles.consideracionesSection}>
                    <Text style={pdfStyles.consideracionesTitle}>Consideraciones Particulares</Text>
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
