"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { informeUpdateSchema, type InformeUpdateInput } from "@/lib/validations/informe.schema";
import { getActiveTiposInforme } from "@/components/tipos-informe/components/actions";
import { getClientLocationsByCliente } from "@/components/clientLocations/components/clientLocations-actions";
import { updateInforme } from "./actions";
import type { Informe } from "./actions";

interface InformeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  informe: Informe;
}

export function InformeEditDialog({ open, onOpenChange, informe }: InformeEditDialogProps) {
  const queryClient = useQueryClient();
  const clienteId = informe.cliente?.id ?? "";

  const { data: tipos = [] } = useQuery({
    queryKey: ["tipos-informe"],
    queryFn: getActiveTiposInforme,
    enabled: open,
  });

  const { data: locaciones = [] } = useQuery({
    queryKey: ["client-locations", clienteId],
    queryFn: () => getClientLocationsByCliente(clienteId),
    enabled: open && Boolean(clienteId),
  });

  const form = useForm<InformeUpdateInput>({
    resolver: zodResolver(informeUpdateSchema) as any,
    defaultValues: {
      tipoDeInformeId: informe.tipoDeInforme?.id ?? "",
      clientLocationId: informe.clientLocation?.id ?? "",
      responsableConfeccion: informe.responsableConfeccion ?? "",
      fechaVencimiento: informe.fechaVencimiento ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipoDeInformeId: informe.tipoDeInforme?.id ?? "",
        clientLocationId: informe.clientLocation?.id ?? "",
        responsableConfeccion: informe.responsableConfeccion ?? "",
        fechaVencimiento: informe.fechaVencimiento ?? "",
      });
    }
  }, [open, informe, form]);

  const handleSubmit = async (data: InformeUpdateInput) => {
    try {
      await updateInforme(informe.id, data);
      toast.success("Informe actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["informes"] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el informe");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar informe</DialogTitle>
          <DialogDescription>
            Modificá los datos del informe. Solo se permite editar informes que no fueron
            entregados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipoDeInformeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de informe *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipos.map((t: { id: string; name: string }) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locación *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná la locación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locaciones.map((l: { id: string; name: string }) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaVencimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vencimiento *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsableConfeccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable de confección</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del responsable" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-sinergia text-white hover:bg-sinergia-hover"
              >
                {isSubmitting ? "Guardando..." : "Actualizar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
