"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * Destino de los enlaces de invitación y de "olvidé mi contraseña".
 * better-auth manda el token por querystring.
 */
function SetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthCard
        title="Enlace inválido"
        description="Este enlace no tiene un token válido o ya expiró."
        footer={
          <Link href="/sign-in" className="font-medium hover:underline">
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Pedí uno nuevo desde “Olvidé mi contraseña”.
        </p>
      </AuthCard>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== repetir) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "No se pudo configurar la contraseña");
      return;
    }

    toast.success("Contraseña configurada. Ya podés ingresar.");
    router.push("/sign-in");
  }

  return (
    <AuthCard title="Definí tu contraseña" description="Elegí una contraseña para tu cuenta">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repetir">Repetir contraseña</Label>
          <Input
            id="repetir"
            type="password"
            autoComplete="new-password"
            required
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function Page() {
  // useSearchParams exige un Suspense boundary en el App Router.
  return (
    <Suspense fallback={<AuthCard title="Cargando…">{null}</AuthCard>}>
      <SetPasswordForm />
    </Suspense>
  );
}
