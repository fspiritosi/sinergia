import { Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./styles";
import { PageFooter } from "./PageFooter";
import { PageHeader } from "./PageHeader";
import type { Items, Moneda, PropuestaTecnica } from "@/generated/client";

interface CondicionesPageProps {
  servicioDescripcion: string;
  servicioNombre: string;
  items: Items[];
  valor: number;
  moneda: Moneda;
  condicionesGenerales?: string[];
  condicionesParticulares?: PropuestaTecnica["condicionesParticulares"];
}

export function CondicionesPage({
  servicioDescripcion,
  condicionesGenerales = [],
  condicionesParticulares = [],
}: CondicionesPageProps) {
  return (
    <Page size="A4" style={pdfStyles.portadaPage}>
      {/* Header reutilizable */}
      <PageHeader serviceDescription={servicioDescripcion} fixed={true} />

      {/* Contenedor principal de 2 columnas que ocupa todo el espacio hasta el footer */}
      <View style={pdfStyles.portadaBody}>
        {/* Columna izquierda: Sidebar vacío */}
        {/* <View style={pdfStyles.portadaSidebar} /> */}

        {/* Columna derecha: Contenido principal - Consideraciones */}
        <View style={pdfStyles.conditionsMainContent}>
          {/* Consideraciones Generales */}
          <Text style={pdfStyles.consideracionesTitle}>Consideraciones Generales</Text>
          {condicionesGenerales.map((item, index) => (
            <View key={index} style={{ flexDirection: "row", marginBottom: 3 }}>
              <View style={pdfStyles.bulletPoint} />
              <Text style={[pdfStyles.consideracion, { flex: 1, paddingLeft: 0 }]}>{item}</Text>
            </View>
          ))}

          {/* Consideraciones Particulares */}
          <Text style={[pdfStyles.consideracionesTitle, { marginTop: 15 }]}>
            Consideraciones Particulares
          </Text>
          {condicionesParticulares.map((item, index) => (
            <View key={index} style={{ flexDirection: "row", marginBottom: 3 }}>
              <View style={pdfStyles.bulletPoint} />
              <Text style={[pdfStyles.consideracion, { flex: 1, paddingLeft: 0 }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <PageFooter />
    </Page>
  );
}
