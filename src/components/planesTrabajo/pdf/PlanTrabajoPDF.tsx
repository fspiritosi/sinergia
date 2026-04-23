import { Document } from "@react-pdf/renderer";
import { ResumenPage } from "./ResumenPage";
import { ProgramacionesPage } from "./ProgramacionesPage";
import type { MonthGroup } from "./ProgramacionesPage";

interface PlanTrabajoPDFProps {
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
  monthGroups: MonthGroup[];
}

export function PlanTrabajoPDF({
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
  monthGroups,
}: PlanTrabajoPDFProps) {
  return (
    <Document
      title={`Plan de Trabajo - ${propuestaCodigo}`}
      author="Sinergia Ambiental"
      subject="Plan de Trabajo"
      creator="Sinergia Management System"
    >
      <ResumenPage
        clienteNombre={clienteNombre}
        propuestaCodigo={propuestaCodigo}
        servicioNombre={servicioNombre}
        servicioDescripcion={servicioDescripcion}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        estado={estado}
        totalProgramaciones={totalProgramaciones}
        completadas={completadas}
        pendientes={pendientes}
        porcentajeCompletado={porcentajeCompletado}
      />

      <ProgramacionesPage servicioDescripcion={servicioDescripcion} monthGroups={monthGroups} />
    </Document>
  );
}
