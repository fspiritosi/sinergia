"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserForm } from "./user-form";
import { createUserAction } from "./actions";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createUserAction(data);
      toast.success("Usuario creado. Se le envió la invitación por email.");
    } catch (error) {
      // El mensaje del servidor distingue "no se pudo crear" de "se creó
      // pero el correo no salió", que son dos situaciones distintas para
      // el admin. Mostrar un texto genérico fue lo que hizo que un SMTP
      // roto pasara semanas sin que nadie se enterara.
      toast.error(error instanceof Error ? error.message : "Error al crear el usuario", {
        duration: 12000,
      });
      throw error;
    } finally {
      // La lista se refresca igual: si el alta se hizo y sólo falló el
      // correo, el usuario tiene que aparecer para poder reenviársela.
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-sinergia text-white hover:bg-sinergia-hover"
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar Usuario
      </Button>
      <UserForm open={open} onOpenChange={setOpen} onSubmit={handleSubmit} isLoading={isLoading} />
    </>
  );
}
