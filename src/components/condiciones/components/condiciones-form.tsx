"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CondicionTipo, type Condicion } from "@/generated/client";
import { useEffect } from "react";

const condicionSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100),
  description: z.string().min(1, "La descripción es requerida").max(1000),
  tipo: z.nativeEnum(CondicionTipo),
  category: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean(),
});

type CondicionFormData = z.infer<typeof condicionSchema>;

interface CondicionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condicion?: Condicion | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function CondicionForm({
  open,
  onOpenChange,
  condicion,
  onSubmit,
  isLoading = false,
}: CondicionFormProps) {
  const isEditing = !!condicion;

  const form = useForm<CondicionFormData>({
    resolver: zodResolver(condicionSchema),
    defaultValues: {
      title: "",
      description: "",
      tipo: "general" as CondicionTipo,
      category: "",
      order: 0,
      is_active: true,
    },
  });

  // Resetear el formulario cuando cambie la condición o se abra/cierre el modal
  useEffect(() => {
    if (open) {
      if (condicion) {
        form.reset({
          title: condicion.title,
          description: condicion.description,
          tipo: condicion.tipo,
          category: condicion.category || "",
          order: condicion.order,
          is_active: condicion.is_active,
        });
      } else {
        form.reset({
          title: "",
          description: "",
          tipo: "general" as CondicionTipo,
          category: "",
          order: 0,
          is_active: true,
        });
      }
    }
  }, [open, condicion, form]);

  const handleSubmit = async (data: CondicionFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // Error ya manejado por el componente padre
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Condición" : "Crear Nueva Condición"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la condición."
              : "Completa los datos para crear una nueva condición."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="particular">Particular</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Order */}
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Título */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la condición" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripción */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción completa de la condición"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categoría */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Categoría (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Visitas, Plazos, Facturación..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Estado</FormLabel>
                      <div className="text-sm text-muted-foreground">Condición activa</div>
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
                {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Condición"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
