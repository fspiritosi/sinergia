import { StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS } from "@/lib/pdf-constants";

export const planTrabajoStyles = StyleSheet.create({
  // Page base
  page: {
    flexDirection: "column",
    backgroundColor: PDF_COLORS.lightGray,
  },

  // Title section
  titleSection: {
    backgroundColor: PDF_COLORS.lightGray,
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
    textAlign: "center",
  },

  // Summary section
  summaryContainer: {
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
    width: 120,
  },
  summaryValue: {
    fontSize: 10,
    color: PDF_COLORS.textDark,
    flex: 1,
  },

  // Divider
  sectionDivider: {
    height: 2,
    backgroundColor: PDF_COLORS.primary,
    marginHorizontal: 25,
    marginVertical: 10,
  },

  // Stats boxes
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 25,
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: PDF_COLORS.cream,
    padding: 12,
    alignItems: "center",
    borderRadius: 4,
  },
  statBoxHighlight: {
    flex: 1,
    backgroundColor: PDF_COLORS.primary,
    padding: 12,
    alignItems: "center",
    borderRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
  },
  statValueWhite: {
    fontSize: 20,
    fontWeight: "bold",
    color: PDF_COLORS.white,
  },
  statLabel: {
    fontSize: 8,
    color: PDF_COLORS.textDark,
    marginTop: 3,
    textAlign: "center",
  },
  statLabelWhite: {
    fontSize: 8,
    color: PDF_COLORS.white,
    marginTop: 3,
    textAlign: "center",
  },

  // Month group header
  monthHeader: {
    backgroundColor: PDF_COLORS.darkBlue,
    padding: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    marginHorizontal: 25,
  },
  monthHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.white,
  },

  // Table
  table: {
    marginHorizontal: 25,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.darkBlue,
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.cream,
    padding: 5,
    minHeight: 22,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: PDF_COLORS.white,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: PDF_COLORS.darkBlue,
  },
  tableCellText: {
    fontSize: 8,
    color: PDF_COLORS.textDark,
  },

  // Column widths
  colItem: { width: "35%" },
  colFecha: { width: "15%" },
  colUbicacion: { width: "22%" },
  colEstado: { width: "13%" },
  colEjecucion: { width: "15%" },

  // Status badges
  badgePendiente: {
    backgroundColor: PDF_COLORS.yellow,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeEjecutado: {
    backgroundColor: PDF_COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeTextPendiente: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    color: PDF_COLORS.textDark,
  },
  badgeTextEjecutado: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    color: PDF_COLORS.white,
  },

  // Page number
  pageNumber: {
    position: "absolute",
    bottom: 55,
    right: 25,
    fontSize: 8,
    color: PDF_COLORS.textDark,
  },

  // Footer (reuse from propuestas)
  footer: {
    backgroundColor: PDF_COLORS.darkBlue,
    color: PDF_COLORS.white,
    padding: 15,
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  footerText: {
    fontSize: 9,
    marginBottom: 2,
  },
});
