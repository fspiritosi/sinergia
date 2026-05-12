import { InspeccionCrear } from "@/components/inspecciones/components/inspeccion-crear";

export default function NuevaInspeccionPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nueva inspección</h1>
        <p className="text-sm text-muted-foreground">
          Seleccioná el cliente, tipo de inspección y lugar para comenzar.
        </p>
      </div>
      <InspeccionCrear redirectBase="/dashboard/inspecciones" />
    </div>
  );
}
