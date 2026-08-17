"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, Send } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/rbac/Can";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getRolesForSelect, resendInvitationAction, updateUserRole, type AppUser } from "./actions";

interface UserRowActionsProps {
  user: AppUser;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState<string>(user.roleId ?? "");
  const [saving, setSaving] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", "select"],
    queryFn: getRolesForSelect,
    enabled: open,
  });

  const handleSave = async () => {
    if (!roleId) {
      toast.error("Seleccioná un rol");
      return;
    }
    setSaving(true);
    try {
      await updateUserRole({ userId: user.id, roleId });
      toast.success("Rol actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async () => {
    setReenviando(true);
    try {
      await resendInvitationAction(user.id);
      toast.success(`Invitación reenviada a ${user.email}`);
    } catch (error) {
      // El detalle importa: distingue "el SMTP rechazó las credenciales" de
      // "no existe la casilla", que se resuelven de formas muy distintas.
      toast.error(error instanceof Error ? error.message : "Error al reenviar la invitación", {
        duration: 10000,
      });
    } finally {
      setReenviando(false);
    }
  };

  return (
    <Can anyOf={[PERMISSIONS.USUARIOS_MANAGE_ROLES, PERMISSIONS.USUARIOS_INVITE]}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[210px]">
          <Can permission={PERMISSIONS.USUARIOS_MANAGE_ROLES}>
            <DropdownMenuItem
              onClick={() => {
                setRoleId(user.roleId ?? "");
                setOpen(true);
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Cambiar rol
            </DropdownMenuItem>
          </Can>
          <Can permission={PERMISSIONS.USUARIOS_INVITE}>
            <DropdownMenuItem
              disabled={reenviando}
              onSelect={(e) => {
                // Sin esto el menú se cierra y desmonta el item antes de que la
                // acción termine, y el estado de "Reenviando…" no se ve nunca.
                e.preventDefault();
                void handleResend();
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              {reenviando ? "Reenviando…" : "Reenviar invitación"}
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              Asigná un nuevo rol a {user.email}. El cambio puede requerir que el usuario vuelva a
              iniciar sesión para tomar efecto completo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label>Rol</Label>
            {rolesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={roleId} onValueChange={setRoleId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || rolesLoading}
              className="bg-sinergia text-white hover:bg-sinergia-hover"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Can>
  );
}
