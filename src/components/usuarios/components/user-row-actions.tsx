"use client";

import { useState } from "react";
import { MoreHorizontal, Shield } from "lucide-react";
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
import { getRolesForSelect, updateUserRole, type AppUser } from "./actions";

interface UserRowActionsProps {
  user: AppUser;
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [roleId, setRoleId] = useState<string>(user.roleId ?? "");
  const [saving, setSaving] = useState(false);

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

  return (
    <Can permission={PERMISSIONS.USUARIOS_MANAGE_ROLES}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            onClick={() => {
              setRoleId(user.roleId ?? "");
              setOpen(true);
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            Cambiar rol
          </DropdownMenuItem>
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
