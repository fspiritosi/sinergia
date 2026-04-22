import { Page, View, Text } from "@react-pdf/renderer";
import { PageHeader } from "@/components/propuestas/pdf/PageHeader";
import { PageFooter } from "@/components/propuestas/pdf/PageFooter";
import { planTrabajoStyles as styles } from "./styles";

interface ResumenPageProps {
  clienteNombre: string;
  propuestaCodigo: string;
  servicioNombre: string;
  servicioDescripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  totalProgramaciones: number;
  completadas: number;
  pendientes: number;
  porcentajeCompletado: number;
}

export function ResumenPage({
  clienteNombre,
  propuestaCodigo,
  servicioNombre,
  servicioDescripcion,
  fechaInicio,
  fechaFin,
  estado,
  totalProgramaciones,
  completadas,
  pendientes,
  porcentajeCompletado,
}: ResumenPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader serviceDescription={servicioDescripcion} />

      <View style={styles.titleSection}>
        <Text style={styles.title}>PLAN DE TRABAJO</Text>
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cliente:</Text>
          <Text style={styles.summaryValue}>{clienteNombre}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Propuesta:</Text>
          <Text style={styles.summaryValue}>{propuestaCodigo}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Servicio:</Text>
          <Text style={styles.summaryValue}>{servicioNombre}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Período:</Text>
          <Text style={styles.summaryValue}>
            {fechaInicio} — {fechaFin}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estado:</Text>
          <Text style={styles.summaryValue}>{estado}</Text>
        </View>
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalProgramaciones}</Text>
          <Text style={styles.statLabel}>Total Programaciones</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{completadas}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{pendientes}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statBoxHighlight}>
          <Text style={styles.statValueWhite}>{porcentajeCompletado}%</Text>
          <Text style={styles.statLabelWhite}>Completado</Text>
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}
