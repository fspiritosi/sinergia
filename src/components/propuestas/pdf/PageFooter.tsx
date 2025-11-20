import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './styles'
import { SINERGIA_CONTACT } from '@/lib/pdf-constants'

export function PageFooter() {
    return (
        <View style={pdfStyles.footer} fixed>
            <Text style={pdfStyles.footerText}>{SINERGIA_CONTACT.email}</Text>
            <Text style={pdfStyles.footerText}>
                {SINERGIA_CONTACT.phones.join(' / ')}
            </Text>
            <Text style={pdfStyles.footerText}>{SINERGIA_CONTACT.address}</Text>
        </View>
    )
}
