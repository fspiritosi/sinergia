"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data, isPending } = useSession();
  const autenticado = Boolean(data?.user);

  return (
    <header className="sticky top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src="/LogoHorizontal.webp"
              alt="Sinergia Logo"
              width={150}
              height={40}
              className="h-16 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {/* Mientras resuelve la sesión no se renderiza nada, para
                        evitar el parpadeo de "Iniciar Sesión" a "Ir al Dashboard". */}
          {isPending ? null : autenticado ? (
            <Link href="/dashboard">
              <Button>Ir al Dashboard</Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
