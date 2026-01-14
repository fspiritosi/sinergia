"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { DetalleVariante } from "./actions";
import { getActiveTiposVariante, type TipoVarianteOption } from "@/components/tipos-variante/components/actions";

const detalleVarianteSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  is_active: z.boolean(),
  variantTypeId: z.string().min(1, "Seleccioná un tipo de variante"),
});

type DetalleVarianteFormData = z.infer<typeof detalleVarianteSchema>;

interface DetalleVarianteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detalleVariante?: DetalleVariante | null;
  onSubmit: (data: DetalleVarianteFormData) => Promise<void>;
  isLoading?: boolean;
}

export function DetalleVarianteForm({
  open,
  onOpenChange,
  detalleVariante,
  onSubmit,
  isLoading = false,
}: DetalleVarianteFormProps) {
  const isEditing = Boolean(detalleVariante);

  const form = useForm<DetalleVarianteFormData>({
    resolver: zodResolver(detalleVarianteSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      variantTypeId: "",
    },
  });

  const [tiposVariante, setTiposVariante] = useState<TipoVarianteOption[]>([]);
  const [tiposVarianteLoading, setTiposVarianteLoading] = useState(false);
  const [tiposVarianteError, setTiposVarianteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;
    const loadTiposVariante = async () => {
      setTiposVarianteLoading(true);
      setTiposVarianteError(null);

      try {
        const tipos = await getActiveTiposVariante();
        if (!isMounted) return;
        setTiposVariante(tipos);
      } catch (error) {
        console.error("Error al cargar tipos de variante:", error);
        if (!isMounted) return;
        setTiposVarianteError("No se pudieron cargar los tipos de variante.");
      } finally {
        if (!isMounted) return;
        setTiposVarianteLoading(false);
      }
    };

    void loadTiposVariante();

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (detalleVariante) {
      form.reset({
        name: detalleVariante.name,
        description: detalleVariante.description ?? "",
        is_active: detalleVariante.is_active,
        variantTypeId: detalleVariante.variantTypeId,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        is_active: true,
        variantTypeId: "",
      });
    }
  }, [open, detalleVariante, form]);

  const handleSubmit = async (data: DetalleVarianteFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar detalle de variante" : "Crear detalle de variante"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualizá la información del detalle de variante."
              : "Completá los campos para registrar un nuevo detalle de variante."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del detalle de variante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variantTypeId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Tipo de variante *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={tiposVarianteLoading || !!tiposVarianteError}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              tiposVarianteLoading
                                ? "Cargando tipos..."
                                : tiposVarianteError ?? "Seleccioná un tipo"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposVariante.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              {tipo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Estado</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Determina si el detalle se encuentra disponible.
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-sinergia text-white hover:bg-sinergia-hover"
              >
                {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
