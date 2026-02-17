"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { TipoVarianteForm } from "./tipoVariante-form";
import {
  updateTipoDeVariante,
  deleteTipoDeVariante,
} from "./tipoVariante-actions";
import type { TipoDeVariante } from "./actions";

interface TipoVarianteRowActionsProps {
  tipoVariante: TipoDeVariante;
}

export function TipoVarianteRowActions({
  tipoVariante,
}: TipoVarianteRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateTipoDeVariante({ ...data, id: tipoVariante.id });
      toast.success("Tipo de variante actualizado");
      setEditOpen(false);
    } catch (error) {
      toast.error("Error al actualizar el tipo de variante");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteTipoDeVariante(tipoVariante.id);
      toast.success("Tipo de variante eliminado");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("No se pudo eliminar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TipoVarianteForm
        open={editOpen}
        onOpenChange={setEditOpen}
        tipoVariante={tipoVariante}
        onSubmit={handleEdit}
        isLoading={isLoading}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de variante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <strong>{tipoVariante.name}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
