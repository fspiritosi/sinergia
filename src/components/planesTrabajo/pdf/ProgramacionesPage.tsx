import { Page, View, Text } from "@react-pdf/renderer";
import { PageHeader } from "@/components/propuestas/pdf/PageHeader";
import { PageFooter } from "@/components/propuestas/pdf/PageFooter";
import { planTrabajoStyles as styles } from "./styles";

export interface ProgramacionRow {
  itemName: string;
  fechaProgramada: string;
  ubicacion: string;
  ejecutado: boolean;
  fechaEjecucion: string;
}

export interface MonthGroup {
  monthLabel: string;
  rows: ProgramacionRow[];
}

interface ProgramacionesPageProps {
  servicioDescripcion: string;
  monthGroups: MonthGroup[];
}

export function ProgramacionesPage({ servicioDescripcion, monthGroups }: ProgramacionesPageProps) {
  if (monthGroups.length === 0) {
    return null;
  }

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageHeader serviceDescription={servicioDescripcion} fixed />

      <View style={styles.titleSection}>
        <Text style={styles.title}>CRONOGRAMA DE ACTIVIDADES</Text>
      </View>

      {/* Table header */}
      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <View style={styles.colItem}>
            <Text style={styles.tableHeaderText}>Item</Text>
          </View>
          <View style={styles.colFecha}>
            <Text style={styles.tableHeaderText}>Fecha</Text>
          </View>
          <View style={styles.colUbicacion}>
            <Text style={styles.tableHeaderText}>Ubicación</Text>
          </View>
          <View style={styles.colEstado}>
            <Text style={styles.tableHeaderText}>Estado</Text>
          </View>
          <View style={styles.colEjecucion}>
            <Text style={styles.tableHeaderText}>Ejecución</Text>
          </View>
        </View>
      </View>

      {/* Month groups */}
      {monthGroups.map((group) => (
        <View key={group.monthLabel} wrap={false}>
          {/* Month header */}
          <View style={styles.monthHeader} minPresenceAhead={40}>
            <Text style={styles.monthHeaderText}>{group.monthLabel}</Text>
          </View>

          {/* Rows */}
          {group.rows.map((row, rowIndex) => (
            <View
              key={`${group.monthLabel}-${rowIndex}`}
              style={[styles.table, styles.tableRow, rowIndex % 2 === 0 ? styles.tableRowEven : {}]}
              wrap={false}
            >
              <View style={styles.colItem}>
                <Text style={styles.tableCellText}>{row.itemName}</Text>
              </View>
              <View style={styles.colFecha}>
                <Text style={styles.tableCellText}>{row.fechaProgramada}</Text>
              </View>
              <View style={styles.colUbicacion}>
                <Text style={styles.tableCellText}>{row.ubicacion}</Text>
              </View>
              <View style={styles.colEstado}>
                <View style={row.ejecutado ? styles.badgeEjecutado : styles.badgePendiente}>
                  <Text
                    style={row.ejecutado ? styles.badgeTextEjecutado : styles.badgeTextPendiente}
                  >
                    {row.ejecutado ? "Ejecutado" : "Pendiente"}
                  </Text>
                </View>
              </View>
              <View style={styles.colEjecucion}>
                <Text style={styles.tableCellText}>{row.fechaEjecucion}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Page numbers */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        fixed
      />

      <PageFooter />
    </Page>
  );
}
