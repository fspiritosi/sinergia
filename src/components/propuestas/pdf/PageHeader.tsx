import { View, Text, Image } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { SINERGIA_ASSETS } from '@/lib/pdf-constants'

interface PageHeaderProps {
    serviceDescription: string
    showTitle?: boolean
    fixed?: boolean
}

export function PageHeader({ serviceDescription, showTitle = false, fixed = false }: PageHeaderProps) {
    return (
        <View fixed={fixed}>
            {/* {showTitle && (
                <View style={pdfStyles.headerTitle}>
                    <Text style={pdfStyles.title}>OFERTA TÉCNICA ECONÓMICA</Text>
                </View>
            )} */}

            <View style={pdfStyles.headerContent}>
                <View style={pdfStyles.verticalBar} />

                <View style={pdfStyles.logoContainer}>
                    <Image
                        src={SINERGIA_ASSETS.logoVertical}
                        style={pdfStyles.logo}
                    />
                </View>

                <View style={pdfStyles.serviceDescription}>
                    <Text style={pdfStyles.serviceTitle}>Descripción del Servicio:</Text>
                    <Text style={pdfStyles.serviceText} hyphenationCallback={(word) => [word]}>
                        {serviceDescription}
                    </Text>
                </View>
            </View>
            
             {showTitle && (
                <View style={pdfStyles.headerTitle}>
                    <Text style={pdfStyles.title}>OFERTA TÉCNICA ECONÓMICA</Text>
                </View>
            )}
        </View>
    )
}
