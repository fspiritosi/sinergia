import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentDbUser } from "@/lib/auth";
import { getMisBorradores } from "@/components/inspecciones/components/actions";

export const revalidate = 0;

export default async function InspeccionLandingPage() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  const borradores = await getMisBorradores(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inspecciones</h1>
        <Button asChild>
          <Link href="/inspeccion/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva inspección
          </Link>
        </Button>
      </div>

      {borradores.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">En progreso</h2>
          {borradores.map((b) => (
            <Link
              key={b.id}
              href={`/inspeccion/${b.id}`}
              className="block rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="font-medium">{(b as any).cliente?.name}</div>
              <div className="text-sm text-muted-foreground">
                {b.tipo === "inspeccion_base" ? "Inspección de Base" : "Inspección de Equipo"}
                {" · "}
                {(b as any).clientLocation?.name ?? b.lugarTexto ?? "—"}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No tenés inspecciones en progreso.</p>
      )}
    </div>
  );
}
