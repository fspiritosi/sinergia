export interface InspeccionSummaryDto {
  id: string;
  clienteNombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  realizadoPorNombre: string | null;
  lugarNombre: string | null;
  createdAt: string;
}

export interface InspeccionRespuestaDto {
  id: string;
  preguntaId: string;
  preguntaCodigo: string;
  valor: string;
  observaciones: string | null;
  accionesSeleccionadasIds: string[];
}

export interface InspeccionDetalleDto {
  id: string;
  clienteId: string;
  clienteNombre: string;
  tipo: string;
  fecha: string;
  estado: string;
  realizadoPorId: string;
  realizadoPorNombre: string | null;
  clientLocationId: string | null;
  clientLocationNombre: string | null;
  lugarTexto: string | null;
  informeId: string | null;
  respuestas: InspeccionRespuestaDto[];
}
