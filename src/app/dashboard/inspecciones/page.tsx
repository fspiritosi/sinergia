import { Inspecciones } from "@/components/inspecciones/Inspecciones";

export const revalidate = 0;

export default function InspeccionesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Inspecciones Ambientales</h1>
        <p className="text-sm text-muted-foreground">
          Formularios de inspección ambiental completados y en progreso.
        </p>
      </div>
      <Inspecciones />
    </div>
  );
}
