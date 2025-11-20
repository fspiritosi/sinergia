import type { Items } from '@/generated/client'
import { Page, Text, View } from '@react-pdf/renderer'
import { PageFooter } from './PageFooter'
import { PageHeader } from './PageHeader'
import { pdfStyles } from './styles'

interface PortadaPageProps {
    codigo: string
    vigencia: string
    clienteNombre: string
    contacto?: string | null
    servicioDescripcion: string
    items: Items[]
}

export function PortadaPage({
    codigo,
    vigencia,
    clienteNombre,
    contacto,
    servicioDescripcion,
    items,
}: PortadaPageProps) {
    const fechaFormateada = new Date(vigencia).toLocaleDateString('es-AR')

    return (
        <Page size="A4" style={pdfStyles.page}>
            <PageHeader serviceDescription={servicioDescripcion} showTitle />

            <View style={pdfStyles.content}>
                <View style={pdfStyles.twoColumns}>
                    {/* Sidebar con datos */}
                    <View style={pdfStyles.sidebar}>
                        <View style={pdfStyles.sidebarItem}>
                            <Text style={pdfStyles.sidebarLabel}>Código OTE:</Text>
                            <Text style={pdfStyles.sidebarValue}>{codigo}</Text>
                        </View>
                        <View style={pdfStyles.sidebarDivider} />

                        <View style={pdfStyles.sidebarItem}>
                            <Text style={pdfStyles.sidebarLabel}>Fecha:</Text>
                            <Text style={pdfStyles.sidebarValue}>{fechaFormateada}</Text>
                        </View>
                        <View style={pdfStyles.sidebarDivider} />

                        <View style={pdfStyles.sidebarItem}>
                            <Text style={pdfStyles.sidebarLabel}>Empresa:</Text>
                            <Text style={pdfStyles.sidebarValue}>{clienteNombre}</Text>
                        </View>
                        <View style={pdfStyles.sidebarDivider} />

                        <View style={pdfStyles.sidebarItem}>
                            <Text style={pdfStyles.sidebarLabel}>Contacto:</Text>
                            <Text style={contacto ? pdfStyles.sidebarValue : pdfStyles.sidebarValueMissing}>
                                {contacto || '[FALTA CONTACTO]'}
                            </Text>
                        </View>
                        <View style={pdfStyles.sidebarDivider} />
                    </View>

                    {/* Contenido principal */}
                    <View style={pdfStyles.mainContent}>
                        <View style={pdfStyles.titleDivider} />
                        <Text style={pdfStyles.sectionTitle}>DETALLE DEL SERVICIO</Text>

                        <View style={pdfStyles.itemsList}>
                            {items.map((item, index) => (
                                <View key={item.id}>
                                    <Text style={pdfStyles.listItem}>
                                        • {item.name}
                                    </Text>
                                    {item.description && (
                                        <View>
                                            {item.description.split('/').map((part, partIndex) => (
                                                <Text key={partIndex} style={[pdfStyles.listItem, { paddingLeft: 5 }]}>
                                                    - {part.trim()}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            <PageFooter />
        </Page>
    )
}
