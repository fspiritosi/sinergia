import type { Items } from '@/generated/client'
import { Page, Text, View, Image } from '@react-pdf/renderer'
import { PageFooter } from './PageFooter'
import { pdfStyles } from './styles'
import { formatDateOnly } from '@/lib/dates'
import { PageHeader } from './PageHeader'

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
    const noHyphenation = (word: string) => [word]
    const fechaFormateada = formatDateOnly(vigencia, 'es-AR')

    return (
        <Page size="A4" style={pdfStyles.portadaPage}>
            {/* Header - Título "OFERTA TÉCNICA ECONÓMICA" */}
            {/* <View style={pdfStyles.headerTitle}>
                <Text style={pdfStyles.title}>OFERTA TÉCNICA ECONÓMICA</Text>
            </View> */}

            {/* Sección Barra | Logo | Descripción - crecen juntas */}
            {/* <View style={pdfStyles.headerContent}>
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
            </View> */}
            <PageHeader serviceDescription={servicioDescripcion}  fixed={true} />
            {/* Contenedor principal de 2 columnas que ocupa todo el espacio hasta el footer */}
            <View style={pdfStyles.portadaBody}>
                
                {/* Columna izquierda: Sidebar */}
                {/* <View style={pdfStyles.portadaSidebar}>
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
                </View> */}

                {/* Columna derecha: Contenido principal - Detalle del servicio */}
                <View style={pdfStyles.portadaMainContent}>
                    {/* <View style={pdfStyles.headerContent}>
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
                     </View> */}
                      <View style={pdfStyles.headerTitle}>
                    <Text style={pdfStyles.title}>OFERTA TÉCNICA ECONÓMICA</Text>
                    </View>
                    <View style={pdfStyles.contentMainContainer}>
                        <View style={pdfStyles.sidebarItem}>
                        <Text style={pdfStyles.sidebarLabel}>Código OTE:</Text>
                        <Text style={pdfStyles.sidebarValue}>{codigo}</Text>
                    </View>
                    {/* <View style={pdfStyles.sidebarDivider} /> */}

                    <View style={pdfStyles.sidebarItem}>
                        <Text style={pdfStyles.sidebarLabel}>Fecha:</Text>
                        <Text style={pdfStyles.sidebarValue}>{fechaFormateada}</Text>
                    </View>
                    {/* <View style={pdfStyles.sidebarDivider} /> */}

                    <View style={pdfStyles.sidebarItem}>
                        <Text style={pdfStyles.sidebarLabel}>Empresa:</Text>
                        <Text style={pdfStyles.sidebarValue}>{clienteNombre}</Text>
                    </View>
                    {/* <View style={pdfStyles.sidebarDivider} /> */}

                    <View style={pdfStyles.sidebarItem}>
                        <Text style={pdfStyles.sidebarLabel}>Contacto:</Text>
                        <Text style={contacto ? pdfStyles.sidebarValue : pdfStyles.sidebarValueMissing}>
                            {contacto || '[FALTA CONTACTO]'}
                        </Text>
                    </View>
                    </View>
                    {/* <View style={pdfStyles.titleDivider} /> */}
                    <Text style={[pdfStyles.sectionTitle, { textAlign: 'left', marginLeft: 10 }]}>Detalle del Servicio</Text>
                    <View style={pdfStyles.contentMainContainer}>


                    <View style={pdfStyles.itemsList} wrap>
                        {items.map((item) => (
                            <View key={item.id} minPresenceAhead={50}>
                                <Text style={[pdfStyles.listItem, { marginTop: 2 }]} hyphenationCallback={noHyphenation}>
                                    • {item.name}
                                </Text>
                                {item.description && (
                                    <View>
                                        {item.description.split('|').map((part, partIndex) => (
                                            <Text
                                                key={partIndex}
                                                style={[pdfStyles.listItem, { paddingLeft: 5 }]}
                                                hyphenationCallback={noHyphenation}
                                            >
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
