import { InspeccionForm } from "@/components/inspecciones/components/inspeccion-form";

export const revalidate = 0;

export default async function InspeccionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InspeccionForm inspeccionId={id} />;
}
