import ClienteDetalle from "@/components/clientes/ClienteDetalle";
export const revalidate = 0;

// Next.js expone params como Promise; hay que hacer await
export default async function ClientesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClienteDetalle id={id} />;
}
