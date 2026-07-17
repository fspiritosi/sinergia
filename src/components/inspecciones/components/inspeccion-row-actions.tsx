"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
import { Can } from "@/components/rbac/Can";
import { usePermissions } from "@/components/rbac/use-permissions";
import { PERMISSIONS, ROLES } from "@/lib/rbac/permissions";
import { eliminarInspeccion } from "./inspeccion-actions";
import type { InspeccionSummaryDto } from "@/dtos";

interface InspeccionRowActionsProps {
  inspeccion: InspeccionSummaryDto;
}

export function InspeccionRowActions({ inspeccion }: InspeccionRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { isRole } = usePermissions();

  const isFinalizada = inspeccion.estado === "completada";
  const isAdmin = isRole(ROLES.ADMIN);
  // Los borradores los borra cualquiera con permiso; los finalizados, solo admin.
  const canDelete = !isFinalizada || isAdmin;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await eliminarInspeccion(inspeccion.id);
      toast.success("Inspección eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["inspecciones"] });
      setDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar la inspección");
    } finally {
      setIsDeleting(false);
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
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/inspecciones/${inspeccion.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver inspección
            </Link>
          </DropdownMenuItem>

          {canDelete && (
            <Can permission={PERMISSIONS.INSPECCIONES_DELETE}>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </Can>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta inspección?</AlertDialogTitle>
            <AlertDialogDescription>
              {isFinalizada
                ? "Este informe está finalizado. Esta acción no se puede deshacer y eliminará permanentemente la inspección con sus respuestas, imágenes y firma asociadas."
                : "Esta acción no se puede deshacer. Se eliminará permanentemente la inspección y sus respuestas e imágenes asociadas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
