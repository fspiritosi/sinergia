"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Reemplazo de `<UserButton />` de Clerk: avatar con iniciales, identidad del
 * usuario y cierre de sesión.
 */
export function UserMenu() {
  const router = useRouter();
  const { data, isPending } = useSession();

  if (isPending || !data?.user) return null;

  const { name, email } = data.user;
  const display = name?.trim() || email;
  const iniciales =
    (
      name
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("") || email[0]
    )?.toUpperCase() ?? "?";

  async function cerrarSesion() {
    await authClient.signOut();
    toast.success("Sesión cerrada");
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-auto py-2"
          aria-label="Abrir menú de usuario"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {iniciales}
          </span>
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
        <DropdownMenuItem disabled>
          <UserIcon className="mr-2 h-4 w-4" />
          Mi cuenta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={cerrarSesion}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
