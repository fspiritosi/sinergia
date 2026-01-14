"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TipoVarianteForm } from "./tipoVariante-form";
import { createTipoDeVariante } from "./tipoVariante-actions";

export function AddTipoVarianteButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createTipoDeVariante(data);
      toast.success("Tipo de variante creado");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el tipo de variante");
      throw error;
    } finally {
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
        Agregar Tipo de Variante
      </Button>
      <TipoVarianteForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
