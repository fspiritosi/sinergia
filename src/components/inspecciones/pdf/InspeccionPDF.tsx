import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { SINERGIA_ASSETS } from "@/lib/pdf-constants";
import { inspeccionStyles as styles } from "./styles";

export type PreguntaPDF = {
  codigo: string;
  texto: string;
  valor: "si" | "no" | "na" | null;
};

export type SeccionPDF = {
  codigo: string;
  titulo: string;
  preguntas: PreguntaPDF[];
};

export type DetalleNoPDF = {
  codigo: string;
  texto: string;
  acciones: string[];
  observaciones: string | null;
  imagenesUrls: string[];
};

export type InspeccionPDFProps = {
  clienteNombre: string;
  fecha: string;
  fechaConfeccion: string;
  lugar: string;
  realizadoPor: string;
  tipo: string;
  secciones: SeccionPDF[];
  detallesNo: DetalleNoPDF[];
  firmaUrl?: string | null;
};

const ESTADO_LABEL: Record<string, string> = {
  si: "SÍ",
  no: "NO",
  na: "NA",
};

function estadoStyle(valor: string | null) {
  if (valor === "si") return styles.estadoSi;
  if (valor === "no") return styles.estadoNo;
  if (valor === "na") return styles.estadoNa;
  return styles.estadoSin;
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogoBox}>
        <Image src={SINERGIA_ASSETS.logoVertical} style={styles.headerLogo} />
      </View>
      <View style={styles.headerTitleBox}>
        <Text style={styles.headerTitle}>INFORME DE INSPECCIÓN AMBIENTAL</Text>
      </View>
    </View>
  );
}

export function InspeccionPDF({
  clienteNombre,
  fecha,
  fechaConfeccion,
  lugar,
  realizadoPor,
  tipo,
  secciones,
  detallesNo,
  firmaUrl,
}: InspeccionPDFProps) {
  return (
    <Document
      title={`Informe de Inspección - ${clienteNombre}`}
      author="Sinergia Ambiental"
      subject="Informe de Inspección Ambiental"
      creator="Sinergia Management System"
    >
      {/* Página 1: cabecera + grilla de estado */}
      <Page size="A4" style={styles.page}>
        <Header />

        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FECHA DE INSPECCIÓN</Text>
            <Text style={styles.infoValue}>{fecha}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FECHA DE CONFECCIÓN</Text>
            <Text style={styles.infoValue}>{fechaConfeccion}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMPRESA</Text>
            <Text style={styles.infoValue}>{clienteNombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TIPO DE INSPECCIÓN</Text>
            <Text style={styles.infoValue}>{tipo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LUGAR</Text>
            <Text style={styles.infoValue}>{lugar}</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>INFORME REALIZADO POR</Text>
            <Text style={styles.infoValue}>{realizadoPor}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resultado de la inspección</Text>

        {secciones.map((seccion) => (
          <View key={seccion.codigo} wrap={false}>
            <Text style={styles.gridSeccion}>
              {seccion.codigo} — {seccion.titulo}
            </Text>
            {seccion.preguntas.map((pregunta) => (
              <View key={pregunta.codigo} style={styles.gridRow}>
                <Text style={styles.gridPregunta}>
                  {pregunta.codigo} {pregunta.texto}
                </Text>
                <Text style={[styles.gridEstado, estadoStyle(pregunta.valor)]}>
                  {pregunta.valor ? ESTADO_LABEL[pregunta.valor] : "—"}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Página 2+: detalle de hallazgos (NO) */}
      <Page size="A4" style={styles.page}>
        <Header />

        <Text style={styles.sectionTitle}>Hallazgos y acciones correctivas / recomendaciones</Text>

        {detallesNo.length === 0 ? (
          <Text style={styles.emptyText}>
            No se registraron hallazgos. Todas las respuestas fueron conformes.
          </Text>
        ) : (
          detallesNo.map((detalle) => (
            <View key={detalle.codigo} style={styles.detalleItem} wrap={false}>
              <Text style={styles.detallePregunta}>
                {detalle.codigo} {detalle.texto}
              </Text>

              {detalle.acciones.length > 0 && (
                <>
                  <Text style={styles.detalleSubtitulo}>
                    Acciones correctivas / Recomendaciones:
                  </Text>
                  {detalle.acciones.map((accion, idx) => (
                    <Text key={idx} style={styles.detalleAccion}>
                      • {accion}
                    </Text>
                  ))}
                </>
              )}

              {detalle.observaciones && (
                <>
                  <Text style={styles.detalleSubtitulo}>Observaciones:</Text>
                  <Text style={styles.detalleObservaciones}>{detalle.observaciones}</Text>
                </>
              )}

              {detalle.imagenesUrls.length > 0 && (
                <View style={styles.imagenesRow}>
                  {detalle.imagenesUrls.map((url, idx) => (
                    <Image key={idx} src={url} style={styles.imagen} />
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        {firmaUrl && (
          <View style={styles.firmaContainer} wrap={false}>
            <Image src={firmaUrl} style={styles.firmaImagen} />
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaLabel}>Firma del responsable</Text>
            <Text style={styles.firmaNombre}>{realizadoPor}</Text>
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
