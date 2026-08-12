"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * Registro público. Se preserva a propósito: hoy `/sign-up` con Clerk permite
 * que cualquiera cree su cuenta, y queda con el rol por defecto (lectura).
 * El rol lo asigna el hook de creación en auth-server.ts.
 */
export function SignUpForm() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    const { error } = await authClient.signUp.email({
      email,
      password,
      name: [nombre.trim(), apellido.trim()].filter(Boolean).join(" "),
    });

    setLoading(false);

    if (error) {
      toast.error(error.message ?? "No se pudo crear la cuenta");
      return;
    }

    // Con requireEmailVerification activo no hay sesión hasta verificar, así
    // que no redirigimos: mostramos el aviso de "revisá tu correo".
    setEnviado(true);
  }

  if (enviado) {
    return (
      <AuthCard
        title="Revisá tu correo"
        description={`Te enviamos un enlace de verificación a ${email}. Al confirmarlo vas a poder ingresar.`}
        footer={
          <Link href="/sign-in" className="font-medium hover:underline">
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Si no lo ves en unos minutos, revisá la carpeta de spam.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Crear cuenta"
      description="Registrate para acceder a Sinergia Ambiental"
      footer={
        <span className="text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            Iniciá sesión
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              autoComplete="given-name"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input
              id="apellido"
              autoComplete="family-name"
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthCard>
  );
}
