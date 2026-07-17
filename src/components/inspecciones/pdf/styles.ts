import { StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS } from "@/lib/pdf-constants";

export const inspeccionStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: PDF_COLORS.white,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PDF_COLORS.textDark,
    marginBottom: 14,
  },
  headerLogoBox: {
    width: 110,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: PDF_COLORS.textDark,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    width: 80,
    height: 60,
    objectFit: "contain",
  },
  headerTitleBox: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
    textAlign: "center",
  },

  // Datos cabecera (tabla)
  infoTable: {
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.darkGray,
    borderBottomWidth: 0,
  },
  infoRowLast: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: PDF_COLORS.darkGray,
  },
  infoLabel: {
    width: 150,
    backgroundColor: PDF_COLORS.secondary,
    padding: 5,
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.white,
  },
  infoValue: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    color: PDF_COLORS.textDark,
  },

  // Section title
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: PDF_COLORS.lightGray,
    padding: 4,
  },

  // Grilla de estado
  gridSeccion: {
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.white,
    backgroundColor: PDF_COLORS.primary,
    padding: 3,
    paddingHorizontal: 5,
    marginTop: 6,
  },
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.darkGray,
    paddingVertical: 3,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  gridPregunta: {
    flex: 1,
    fontSize: 8,
    color: PDF_COLORS.textDark,
    paddingRight: 6,
  },
  gridEstado: {
    width: 36,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  estadoSi: { color: "#15803d" },
  estadoNo: { color: "#b91c1c" },
  estadoNa: { color: "#6b7280" },
  estadoSin: { color: "#9ca3af" },

  // Detalle NO
  detalleItem: {
    marginBottom: 14,
  },
  detallePregunta: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
    marginBottom: 4,
  },
  detalleSubtitulo: {
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
    marginTop: 4,
    marginBottom: 2,
  },
  detalleAccion: {
    fontSize: 9,
    color: PDF_COLORS.textDark,
    marginBottom: 2,
    paddingLeft: 8,
  },
  detalleObservaciones: {
    fontSize: 9,
    color: PDF_COLORS.textDark,
    fontStyle: "italic",
  },
  imagenesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  imagen: {
    width: 150,
    height: 110,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: PDF_COLORS.darkGray,
  },

  emptyText: {
    fontSize: 9,
    color: PDF_COLORS.textDark,
    fontStyle: "italic",
    marginTop: 6,
  },

  // Firma del responsable
  firmaContainer: {
    marginTop: 40,
    alignItems: "center",
    alignSelf: "flex-end",
    width: 220,
  },
  firmaImagen: {
    width: 160,
    height: 70,
    objectFit: "contain",
  },
  firmaLinea: {
    width: 200,
    borderTopWidth: 0.5,
    borderTopColor: PDF_COLORS.textDark,
    marginTop: 2,
    marginBottom: 4,
  },
  firmaLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.textDark,
  },
  firmaNombre: {
    fontSize: 8,
    color: PDF_COLORS.textDark,
  },

  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: PDF_COLORS.textDark,
  },
});
