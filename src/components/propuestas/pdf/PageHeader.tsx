import { View, Text, Image } from '@react-pdf/renderer'
import { pdfStyles } from './styles'

interface PageHeaderProps {
    serviceDescription: string
    showTitle?: boolean
}

export function PageHeader({ serviceDescription, showTitle = false }: PageHeaderProps) {
    return (
        <View>
            {showTitle && (
                <View style={pdfStyles.headerTitle}>
                    <Text style={pdfStyles.title}>OFERTA TÉCNICA ECONÓMICA</Text>
                </View>
            )}

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
                    <Text style={pdfStyles.serviceText}>{serviceDescription}</Text>
                </View>
            </View>
        </View>
    )
}
