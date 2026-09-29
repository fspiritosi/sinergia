"use client";

import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TipoInformeForm } from "./tipoInforme-form";
import { updateTipoDeInforme, deleteTipoDeInforme } from "./tipoInforme-actions";
import { TipoDeInforme } from "./actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Can } from "@/components/rbac/Can";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { useState } from "react";

interface TipoInformeRowActionsProps {
  tipoInforme: TipoDeInforme;
}

export function TipoInformeRowActions({ tipoInforme }: TipoInformeRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleEdit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateTipoDeInforme({ ...data, id: tipoInforme.id });
      toast.success("Tipo de informe actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el tipo de informe");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteTipoDeInforme(tipoInforme.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Tipo de informe eliminado exitosamente");
      await queryClient.invalidateQueries({ queryKey: ["tipos-informe"] });
    } catch {
      toast.error("Error al eliminar el tipo de informe");
    } finally {
      setIsLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <Can permission={PERMISSIONS.TIPOS_INFORME_DELETE}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <TipoInformeForm
        open={editOpen}
        onOpenChange={setEditOpen}
        tipoInforme={tipoInforme}
        onSubmit={handleEdit}
        isLoading={isLoading}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el Tipo de Informe{" "}
              <strong>{tipoInforme.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
