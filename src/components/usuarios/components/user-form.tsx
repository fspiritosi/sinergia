"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getRolesForSelect } from "./actions";

const userSchema = z.object({
  email: z.string().min(1, "El email es requerido"),
  firstName: z.string().min(1, "El nombre del usuario es requerido"),
  lastName: z.string().min(1, "El apellido del usuario es requerido"),
  roleId: z.string().min(1, "El rol del usuario es requerido"),
});

export type UserFormSubmitData = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormSubmitData) => Promise<void>;
  isLoading?: boolean;
}

export function UserForm({ open, onOpenChange, onSubmit, isLoading = false }: UserFormProps) {
  const form = useForm<UserFormSubmitData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        email: "",
        firstName: "",
        lastName: "",
        roleId: "",
      });
    }
  }, [open, form]);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", "select"],
    queryFn: getRolesForSelect,
    enabled: open,
  });

  const handleSubmit = async (data: UserFormSubmitData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch {
      // Error manejado por el componente padre / mutationCache global
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
          <DialogDescription>
            Se enviará una invitación por email. El usuario completará su registro con la contraseña
            que elija.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <FormControl>
                    {rolesLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {(roles ?? []).map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || rolesLoading}
                className="bg-sinergia text-white hover:bg-sinergia-hover"
              >
                {isLoading ? "Creando..." : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
