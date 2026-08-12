"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviandoReset, setEnviandoReset] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signIn.email({ email, password });

    setLoading(false);

    if (error) {
      // Mensaje deliberadamente genérico: distinguir "no existe" de "clave
      // incorrecta" permitiría enumerar usuarios.
      toast.error(error.message ?? "Email o contraseña incorrectos");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function onOlvideContrasena() {
    if (!email) {
      toast.error("Ingresá tu email primero");
      return;
    }

    setEnviandoReset(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/set-password",
    });
    setEnviandoReset(false);

    if (error) {
      toast.error(error.message ?? "No se pudo enviar el correo");
      return;
    }

    toast.success("Si el email existe, te enviamos un enlace para restablecerla");
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Ingresá con tu cuenta de Sinergia Ambiental"
      footer={
        <span className="text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/sign-up" className="font-medium text-foreground hover:underline">
            Registrate
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>

      <button
        type="button"
        onClick={onOlvideContrasena}
        disabled={enviandoReset}
        className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
      >
        {enviandoReset ? "Enviando…" : "Olvidé mi contraseña"}
      </button>
    </AuthCard>
  );
}
