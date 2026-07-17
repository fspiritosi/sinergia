"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientes } from "@/components/clientes/components/actions";
import { getActiveClientLocations } from "@/components/clientLocations/components/actions";
import { crearInspeccion } from "./inspeccion-actions";

/** Fecha de hoy en formato YYYY-MM-DD respetando la zona horaria local. */
function todayDateInputValue(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const crearInspeccionSchema = z
  .object({
    clienteId: z.string().min(1, "El cliente es requerido"),
    tipo: z.enum(["inspeccion_base", "inspeccion_equipo"]),
    fechaInspeccion: z.string().min(1, "La fecha de inspección es requerida"),
    clientLocationId: z.string().optional(),
    lugarTexto: z.string().optional(),
    informeId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "inspeccion_base") return !!data.clientLocationId;
      if (data.tipo === "inspeccion_equipo") return !!data.lugarTexto;
      return true;
    },
    { message: "El lugar es requerido", path: ["clientLocationId"] }
  );

type CrearInspeccionFormData = z.infer<typeof crearInspeccionSchema>;

interface InspeccionCrearProps {
  redirectBase: string;
}

export function InspeccionCrear({ redirectBase }: InspeccionCrearProps) {
  const router = useRouter();

  const form = useForm<CrearInspeccionFormData>({
    resolver: zodResolver(crearInspeccionSchema),
    defaultValues: {
      clienteId: "",
      tipo: "inspeccion_base",
      fechaInspeccion: todayDateInputValue(),
      clientLocationId: undefined,
      lugarTexto: "",
      informeId: undefined,
    },
  });

  const clienteId = form.watch("clienteId");
  const tipo = form.watch("tipo");

  const { data: clientes, isLoading: clientesLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
  });

  const { data: clientLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ["client-locations", clienteId],
    queryFn: () => getActiveClientLocations(clienteId),
    enabled: !!clienteId && tipo === "inspeccion_base",
  });

  const mutation = useMutation({
    mutationFn: (data: CrearInspeccionFormData) =>
      crearInspeccion({
        clienteId: data.clienteId,
        tipo: data.tipo,
        fechaInspeccion: data.fechaInspeccion,
        clientLocationId: data.clientLocationId ?? null,
        lugarTexto: data.lugarTexto ?? null,
        informeId: data.informeId ?? null,
      }),
    onSuccess: (result) => {
      toast.success("Inspección creada correctamente");
      router.push(`${redirectBase}/${result.id}`);
    },
  });

  const handleSubmit = (data: CrearInspeccionFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Datos de la inspección</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Cliente */}
            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <FormControl>
                    {clientesLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("clientLocationId", undefined);
                        }}
                        disabled={mutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {(clientes ?? []).map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.name}
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

            {/* Tipo */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de inspección *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("clientLocationId", undefined);
                        form.setValue("lugarTexto", "");
                      }}
                      className="flex flex-col gap-2"
                      disabled={mutation.isPending}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="inspeccion_base" id="tipo-base" />
                        <Label htmlFor="tipo-base">Inspección de Base</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="inspeccion_equipo" id="tipo-equipo" />
                        <Label htmlFor="tipo-equipo">Inspección de Equipo</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de la inspección (día en que se realizó) */}
            <FormField
              control={form.control}
              name="fechaInspeccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de la inspección *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lugar: ClientLocation (base) o lugarTexto (equipo) */}
            {tipo === "inspeccion_base" && (
              <FormField
                control={form.control}
                name="clientLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sede / Ubicación *</FormLabel>
                    <FormControl>
                      {locationsLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          disabled={!clienteId || mutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !clienteId
                                  ? "Primero seleccioná un cliente"
                                  : "Seleccionar ubicación"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(clientLocations ?? []).map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
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
            )}

            {tipo === "inspeccion_equipo" && (
              <FormField
                control={form.control}
                name="lugarTexto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar / Equipo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Compresor sala 3"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-sinergia text-white hover:bg-sinergia-hover"
            >
              {mutation.isPending ? "Creando..." : "Crear y comenzar inspección"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
