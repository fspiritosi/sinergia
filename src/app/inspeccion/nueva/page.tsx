import { InspeccionCrear } from "@/components/inspecciones/components/inspeccion-crear";

export default function NuevaInspeccionTabletPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nueva inspección</h1>
      <InspeccionCrear redirectBase="/inspeccion" />
    </div>
  );
}
