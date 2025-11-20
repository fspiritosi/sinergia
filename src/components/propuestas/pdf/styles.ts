import { StyleSheet } from '@react-pdf/renderer'
import { PDF_COLORS } from '@/lib/pdf-constants'

export const pdfStyles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: PDF_COLORS.white,
        padding: 20,
    },

    // Header
    headerTitle: {
        backgroundColor: PDF_COLORS.lightGray,
        padding: 20,
        width: '100%',
        marginBottom: 0,
        height: 70,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PDF_COLORS.darkBlue,
        textAlign: 'center',
    },
    headerContent: {
        flexDirection: 'row',
    },
    verticalBar: {
        width: 25,
        backgroundColor: PDF_COLORS.darkBlue,
    },
    logoContainer: {
        width: 180,
        backgroundColor: PDF_COLORS.white,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 150,
        height: 150,
        objectFit: 'contain',
    },
    serviceDescription: {
        flex: 1,
        backgroundColor: PDF_COLORS.darkGray,
        padding: 15,
        justifyContent: 'center',
    },
    serviceTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: PDF_COLORS.textDarkBlue,
        marginBottom: 8,
    },
    serviceText: {
        fontSize: 12,
        lineHeight: 1.6,
        color: PDF_COLORS.textDarkBlue,
    },

    // Content
    content: {
        padding: 0,
        flex: 1,
    },
    twoColumns: {
        flexDirection: 'row',
        gap: 20,
        height: '100%',
    },
    sidebar: {
        width: 205,
        backgroundColor: PDF_COLORS.cream,
        padding: 15,
        paddingTop: 40,
        height: '100%',
    },
    sidebarItem: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'center',
    },
    sidebarDivider: {
        height: 0.7,
        backgroundColor: PDF_COLORS.darkBlue,
        marginBottom: 10,
        width: '100%',
    },
    sidebarLabel: {
        fontSize: 10,
        fontWeight: 'semibold',
        color: PDF_COLORS.darkBlue,
        marginRight: 5,
        width: 60,
    },
    sidebarValue: {
        fontSize: 10,
        color: PDF_COLORS.darkBlue,
        flex: 1,
    },
    sidebarValueMissing: {
        fontSize: 10,
        color: PDF_COLORS.darkBlue,
        backgroundColor: PDF_COLORS.yellow,
        padding: 2,
        flex: 1,
    },
    mainContent: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: PDF_COLORS.darkBlue,
        marginBottom: 15,
        textAlign: 'center',
    },
    titleDivider: {
        height: 2,
        backgroundColor: PDF_COLORS.primary,
        width: 200,
        alignSelf: 'center',
        marginBottom: 10,
    },
    itemsList: {
        marginTop: 10,
    },
    listItem: {
        fontSize: 11,
        marginBottom: 2,
        paddingLeft: 1,
        lineHeight: 1.5,
        color: PDF_COLORS.textDarkBlue,
    },

    // Page 2 specific
    consideracionesSection: {
        marginBottom: 20,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    consideracionesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: PDF_COLORS.darkBlue,
        marginBottom: 14,
        textAlign: 'left',
    },
    consideracion: {
        fontSize: 10,
        marginBottom: 8,
        paddingLeft: 10,
        lineHeight: 1.5,
        color: PDF_COLORS.textDarkBlue,
    },
    bulletPoint: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: PDF_COLORS.darkBlue,
        marginTop: 6,
        marginRight: 5,
    },

    // Tabla Oferta
    offerContainer: {
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    offerRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    offerHeaderBox: {
        backgroundColor: PDF_COLORS.cream,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offerValueBox: {
        padding: 10,
        justifyContent: 'center',
    },
    offerBoxLeft: {
        flex: 2,
    },
    offerBoxRight: {
        flex: 1,
    },
    offerHeaderText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: PDF_COLORS.darkBlue,
        textAlign: 'center',
    },
    offerValueText: {
        fontSize: 10,
        color: PDF_COLORS.darkBlue, // Will be black/dark on gradient? Image shows black text on left box.
    },
    offerValueTextRight: {
        fontSize: 12,
        fontWeight: 'bold',
        color: PDF_COLORS.white, // Assuming white text on gradient for the value
        textAlign: 'center',
    },

    // Notas
    notasSection: {
        marginTop: 15,
        paddingHorizontal: 20,
    },
    nota: {
        fontSize: 7,
        marginBottom: 4,
        fontWeight: 'bold',
        color: PDF_COLORS.textDark,
    },

    // Footer
    footer: {
        backgroundColor: PDF_COLORS.darkBlue,
        color: PDF_COLORS.white,
        padding: 15,
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: 9,
        marginBottom: 2,
    },
})
