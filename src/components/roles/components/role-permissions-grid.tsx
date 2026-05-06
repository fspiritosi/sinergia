"use client";

import { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateRolePermissions } from "./role-actions";
import type { RoleWithPermissionsDto, PermissionDto } from "@/dtos/role.dto";

const MODULE_LABELS: Record<string, string> = {
  clientes: "Clientes",
  servicios: "Servicios",
  items: "Items",
  "tipos-informe": "Tipos de Informe",
  "tipos-variante": "Tipos de Variante",
  "detalles-variante": "Detalles de Variante",
  condiciones: "Condiciones",
  usuarios: "Usuarios",
  propuestas: "Propuestas",
  planes: "Planes de Trabajo",
  planificacion: "Planificación",
  informes: "Informes",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
  approve: "Aprobar",
  reject: "Rechazar",
  "download-pdf": "Descargar PDF",
  schedule: "Programar",
  "generate-pdf": "Generar PDF",
  assign: "Asignar",
  deliver: "Entregar",
  "upload-file": "Subir archivo",
  "download-file": "Descargar archivo",
  invite: "Invitar",
  deactivate: "Desactivar",
  "manage-roles": "Gestionar roles",
};

type Props = {
  role: RoleWithPermissionsDto;
  allPermissions: PermissionDto[];
};

export function RolePermissionsGrid({ role, allPermissions }: Props) {
  const queryClient = useQueryClient();
  const readOnly = role.isSystem;

  const initialCodes = useMemo(
    () => new Set(role.permissions.map((p) => p.code)),
    [role.permissions]
  );

  const [selected, setSelected] = useState<Set<string>>(initialCodes);

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionDto[]>();
    for (const p of allPermissions) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      (MODULE_LABELS[a] ?? a).localeCompare(MODULE_LABELS[b] ?? b, "es")
    );
  }, [allPermissions]);

  const dirty = useMemo(() => {
    if (selected.size !== initialCodes.size) return true;
    for (const c of selected) if (!initialCodes.has(c)) return true;
    return false;
  }, [selected, initialCodes]);

  const mutation = useMutation({
    mutationFn: (codes: string[]) => updateRolePermissions(role.id, codes),
    onSuccess: () => {
      toast.success("Permisos actualizados");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", role.id] });
    },
  });

  const toggle = (code: string, checked: boolean) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const toggleModule = (codes: string[], allChecked: boolean) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) codes.forEach((c) => next.delete(c));
      else codes.forEach((c) => next.add(c));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grouped.map(([moduleName, perms]) => {
          const codes = perms.map((p) => p.code);
          const checkedCount = codes.filter((c) => selected.has(c)).length;
          const allChecked = checkedCount === codes.length;

          return (
            <Card key={moduleName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {MODULE_LABELS[moduleName] ?? moduleName}
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => toggleModule(codes, allChecked)}
                    disabled={readOnly}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allChecked ? "Desmarcar todo" : "Marcar todo"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {checkedCount} de {codes.length}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      id={p.code}
                      checked={selected.has(p.code)}
                      onCheckedChange={(c) => toggle(p.code, Boolean(c))}
                      disabled={readOnly}
                    />
                    <Label
                      htmlFor={p.code}
                      className="cursor-pointer text-sm font-normal"
                      title={p.description}
                    >
                      {ACTION_LABELS[p.action] ?? p.action}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!readOnly ? (
        <div className="flex items-center justify-end gap-2">
          {dirty ? <p className="text-sm text-muted-foreground">Hay cambios sin guardar.</p> : null}
          <Button
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate(Array.from(selected))}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar permisos
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Este es un rol del sistema. Sus permisos no se pueden modificar.
        </p>
      )}
    </div>
  );
}
