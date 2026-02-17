"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DetalleVarianteForm } from "./detalleVariante-form";
import { createDetalleVariante } from "./detalleVariante-actions";

export function AddDetalleVarianteButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await createDetalleVariante(data);
      toast.success("Detalle de variante creado");
      setOpen(false);
    } catch (error) {
      toast.error("No se pudo crear el detalle");
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
        Agregar Detalle
      </Button>
      <DetalleVarianteForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
