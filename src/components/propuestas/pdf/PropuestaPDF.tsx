import { Document } from "@react-pdf/renderer";
import { PortadaPage } from "./PortadaPage";
import { OfertaEconomicaPage } from "./OfertaEconomicaPage";
import { CondicionesPage } from "./CondicionesPage";
import type { Items, Moneda, PropuestaTecnica } from "@/generated/client";

interface PropuestaPDFProps {
  codigo: string;
  vigencia: string;
  clienteNombre: string;
  contacto?: string | null;
  servicioNombre: string;
  servicioDescripcion: string;
  servicioType: string;
  items: Items[];
  valor: number;
  moneda: Moneda;
  condicionesGenerales: string[];
  condicionesParticulares: PropuestaTecnica["condicionesParticulares"];
}

export function PropuestaPDF({
  codigo,
  vigencia,
  clienteNombre,
  contacto,
  servicioNombre,
  servicioDescripcion,
  servicioType,
  items,
  valor,
  moneda,
  condicionesGenerales,
  condicionesParticulares,
}: PropuestaPDFProps) {
  return (
    <Document
      title={`Propuesta ${codigo}`}
      author="Sinergia Ambiental"
      subject="Oferta Técnica Económica"
      creator="Sinergia Management System"
    >
      <PortadaPage
        codigo={codigo}
        vigencia={vigencia}
        clienteNombre={clienteNombre}
        contacto={contacto}
        servicioDescripcion={servicioDescripcion}
        items={items}
      />

      <CondicionesPage
        servicioDescripcion={servicioDescripcion}
        servicioNombre={servicioNombre}
        items={items}
        valor={valor}
        moneda={moneda}
        condicionesGenerales={condicionesGenerales}
        condicionesParticulares={condicionesParticulares}
      />

      <OfertaEconomicaPage
        servicioDescripcion={servicioDescripcion}
        servicioNombre={servicioNombre}
        servicioType={servicioType}
        items={items}
        valor={valor}
        moneda={moneda}
        condicionesParticulares={condicionesParticulares}
      />
    </Document>
  );
}
