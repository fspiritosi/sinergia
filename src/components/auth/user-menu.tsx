"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { avatarUrl, iniciales } from "@/lib/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MiCuentaDialog } from "./mi-cuenta-dialog";

/**
 * Reemplazo de `<UserButton />` de Clerk: foto (o iniciales), identidad del
 * usuario, acceso a "Mi cuenta" y cierre de sesión.
 */
export function UserMenu() {
  const router = useRouter();
  const { data, isPending } = useSession();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);

  if (isPending || !data?.user) return null;

  const { id, name, email } = data.user;
  const display = name?.trim() || email;
  const foto = avatarUrl(id, data.user.image as string | null);

  async function cerrarSesion() {
    await authClient.signOut();
    toast.success("Sesión cerrada");
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 px-2 h-auto py-2"
            aria-label="Abrir menú de usuario"
          >
            <Avatar className="size-8 shrink-0">
              {foto ? <AvatarImage src={foto} alt="" /> : null}
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {iniciales(name, email)}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col items-start">
              <span className="truncate text-xs font-semibold">{display}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block text-sm font-medium">{display}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCuentaAbierta(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Mi cuenta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={cerrarSesion}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MiCuentaDialog open={cuentaAbierta} onOpenChange={setCuentaAbierta} />
    </>
  );
}
