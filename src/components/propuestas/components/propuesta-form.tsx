"use client";

import { getClientes } from "@/components/clientes/components/actions";
import { getActiveServicios } from "@/components/servicios/components/actions";
import { getItemsService } from "@/components/servicios/components/service-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import type { Cliente, Items, Servicio } from "@/generated/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { PropuestaTecnica } from "./actions";
import { parseDateOnlyToLocalNoon, toDateOnlyString } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { SortableItemsList } from "./sortable-items-list";
import { getActiveCondicionesByTipo } from "@/components/condiciones/components/actions";
import { Loader2 } from "lucide-react";

const MONEDA_OPTIONS = ["ARS", "USD", "EUR"] as const;
const monedaEnum = z.enum(MONEDA_OPTIONS);
type MonedaValue = z.infer<typeof monedaEnum>;

const STATUS_OPTIONS = ["pendiente", "aprobada", "rechazada", "en_progreso", "finalizada"] as const;
const statusEnum = z.enum(STATUS_OPTIONS);
type StatusValue = z.infer<typeof statusEnum>;

const propuestaSchema = z.object({
  codigo: z.string().min(1, "El código es requerido"),
  clienteId: z.string().min(1, "Seleccioná un cliente"),
  servicioId: z.string().min(1, "Seleccioná un servicio"),
  vigencia: z
    .string()
    .min(1, "La vigencia es requerida")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Ingresá una fecha válida",
    }),
  items: z.array(z.string()).min(1, "Seleccioná al menos un item"),
  contacto: z.string().optional(),
  valor: z
    .string()
    .min(1, "El valor es requerido")
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Ingresá un número válido",
    })
    .refine((value) => Number(value) >= 0, {
      message: "El valor debe ser mayor o igual a 0",
    }),
  moneda: monedaEnum,
  status: statusEnum,
  condicionesParticulares: z
    .array(z.string())
    .min(1, "Seleccioná al menos una condición particular"),
});

type PropuestaFormData = z.infer<typeof propuestaSchema>;

// export const CONDICIONES_PARTICULARES: CondicionesParticulares[] = [
//     {
//         id: 1,
//         type: 'Visitas',
//         title: 'Visita mensual (1)',
//         description: 'El servicio considera una (1) actividad ambiental mensual, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.'
//     },
//     {
//         id: 2,
//         type: 'Visitas',
//         title: 'Visita mensual (2)',
//         description: 'El servicio considera dos (2) actividades ambientales mensuales, las cuales estarán establecidas en un cronograma de actividades pactado con la empresa y disponibilidad full time para consultas y/o asesoramiento técnico vía telefónica o correo electrónico.'
//     },
//     {
//         id: 3,
//         type: 'Incluye',
//         title: 'Estudios no incluidos',
//         description: 'La confección de Estudios de Impacto Ambiental, Auditorías Ambientales e Informes Ambientales no están incluidos en la presente Oferta Técnica Económica. Los mismos pueden solicitarse en un presupuesto independiente.'
//     },
//     {
//         id: 4,
//         type: 'Plazos',
//         title: 'Plazo de entrega (30 días)',
//         description: 'El plazo de entrega del Estudio / Informe / Auditoría Ambiental es de 30 días hábiles a partir de la fecha de aprobación de la presente Oferta Técnica.'
//     },
//     {
//         id: 5,
//         type:'Incluye',
//         title: 'Incluye ampliaciones',
//         description: 'El costo total de la propuesta incluye las ampliaciones y otras solicitudes que pudieran surgir por la autoridad de aplicación respecto a lo presentado.'
//     },
//     {
//         id: 6,
//         type: 'Incluye',
//         title: 'Visados incluidos',
//         description: 'Los costos de visados del Colegio de Profesionales del Ambiente de Neuquén están incluidos en esta Oferta Técnica Económica.'
//     },
//     {
//         id: 7,
//         type: 'Plazos',
//         title: 'Acuerdo de Trabajo (12 meses)',
//         description: 'La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a doce (12) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.'
//     },
//     {
//         id: 8,
//         type:'Plazos',
//         title: 'Acuerdo de Trabajo (6 meses)',
//         description: 'La presente Oferta Técnica Económica es con un Acuerdo de Trabajo a seis (6) meses, quedando abierta la posibilidad de analizar los resultados obtenidos por la prestación del servicio profesional y recontratar por un nuevo periodo con nuevos objetivos.'
//     },
//     {
//         id: 9,
//         type: 'Facturación',
//         title: 'Facturación Tipo A',
//         description: 'La Facturación Tipo A del servicio es mensual. '
//     },
//     {
//         id: 10,
//         type: 'Facturación',
//         title: 'IVA no incluido',
//         description: 'El presente presupuesto no incluye IVA.'
//     },
//     {
//         id: 11,
//         type: 'Facturación',
//         title: 'Facturación Tipo C',
//         description: 'La Facturación Tipo C del servicio es mensual.'
//     },
//     {
//         id: 12,
//         type: 'Condiciones de Pago',
//         title: 'Condición de Pago 30 días',
//         description: 'La condición de pago es a 30 días.'
//     },
//     {
//         id: 13,
//         type:'Condiciones de Pago',
//         title: 'Condiciones de Pago',
//         description: 'Las condiciones de pago son a contra factura y contra entrega del Informe Ambiental.'
//     },
//     {
//         id: 14,
//         type: 'Ajuste',
//         title: "Ajuste Trimestral 10%",
//         description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 10"
//     },
//     {
//         id: 15,
//         type: 'Ajuste',
//         title: "Ajuste Trimestral 20%",
//         description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral del 20"
//     },
//     {
//         id: 16,
//         type: 'Ajuste',
//         title: "Ajuste Trimestral IPC",
//         description: "El valor cotizado en el presente presupuesto tendrá un ajuste trimestral por IPC"
//     }

// ]

const formatDateForInput = (date?: string | Date | null) => {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
};

interface PropuestaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propuesta?: PropuestaTecnica | null;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function PropuestaForm({
  open,
  onOpenChange,
  propuesta,
  onSubmit,
  isLoading = false,
}: PropuestaFormProps) {
  const isEditing = !!propuesta;

  const form = useForm<PropuestaFormData>({
    resolver: zodResolver(propuestaSchema),
    defaultValues: {
      codigo: "",
      clienteId: "",
      servicioId: "",
      vigencia: "",
      items: [],
      contacto: "",
      valor: "",
      moneda: MONEDA_OPTIONS[0],
      status: STATUS_OPTIONS[0],
      condicionesParticulares: [],
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState<string | null>(null);

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [serviciosLoading, setServiciosLoading] = useState(false);
  const [serviciosError, setServiciosError] = useState<string | null>(null);
  const [serviciosConItems, setServiciosConItems] = useState<Record<string, boolean>>({});

  const [servicioItems, setServicioItems] = useState<Items[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [condicionesParticulares, setCondicionesParticulares] = useState<
    Awaited<ReturnType<typeof getActiveCondicionesByTipo>>
  >([]);
  const [condicionesLoading, setCondicionesLoading] = useState(false);

  const selectedServicioId = form.watch("servicioId");

  const condicionesParticularesGrouped = useMemo(() => {
    const groups = new Map<string, typeof condicionesParticulares>();
    for (const condicion of condicionesParticulares) {
      const key = condicion.category || "Sin categoría";
      const existing = groups.get(key);
      if (existing) {
        existing.push(condicion);
      } else {
        groups.set(key, [condicion]);
      }
    }

    const entries = Array.from(groups.entries())
      .map(([type, condiciones]) => {
        const sorted = [...condiciones].sort((a, b) => a.order - b.order);
        return [type, sorted] as const;
      })
      .sort(([a], [b]) => a.localeCompare(b, "es"));

    return entries;
  }, [condicionesParticulares]);

  // Resetear el formulario cuando cambie el cliente o se abra/cierre el modal
  useEffect(() => {
    if (open) {
      if (propuesta) {
        form.reset({
          codigo: propuesta.codigo,
          clienteId: propuesta.clienteId,
          servicioId: propuesta.servicioId,
          vigencia: formatDateForInput(propuesta.vigencia),
          items: propuesta.items,
          contacto: propuesta.contacto ?? "",
          valor: propuesta.valor?.toString() ?? "",
          moneda: (propuesta.moneda as MonedaValue | null) ?? MONEDA_OPTIONS[0],
          status: (propuesta.status as StatusValue | null) ?? STATUS_OPTIONS[0],
          condicionesParticulares: propuesta.condicionesParticulares,
        });
      } else {
        form.reset({
          codigo: "",
          clienteId: "",
          servicioId: "",
          vigencia: "",
          items: [],
          contacto: "",
          valor: "",
          moneda: MONEDA_OPTIONS[0],
          status: STATUS_OPTIONS[0],
          condicionesParticulares: [],
        });
      }
    }
  }, [open, propuesta, form]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadClientesYServicios = async () => {
      setClientesLoading(true);
      setServiciosLoading(true);
      setCondicionesLoading(true);
      setClientesError(null);
      setServiciosError(null);

      try {
        const [clientesResponse, serviciosResponse, condicionesResponse] = await Promise.all([
          getClientes(),
          getActiveServicios(),
          getActiveCondicionesByTipo("particular"),
        ]);

        if (isMounted) {
          const activeClientes = clientesResponse.filter((cliente) => cliente.is_active);
          const activeServicios = serviciosResponse.filter((servicio) => servicio.is_active);

          setCondicionesParticulares(condicionesResponse);
          setCondicionesLoading(false);

          if (propuesta) {
            const selectedCliente = clientesResponse.find(
              (cliente) => cliente.id === propuesta.clienteId
            );
            if (selectedCliente && !selectedCliente.is_active) {
              activeClientes.push(selectedCliente);
            }

            const selectedServicio = serviciosResponse.find(
              (servicio) => servicio.id === propuesta.servicioId
            );
            if (selectedServicio && !selectedServicio.is_active) {
              activeServicios.push(selectedServicio);
            }
          }

          const uniqueClientes = Array.from(
            new Map(activeClientes.map((cliente) => [cliente.id, cliente])).values()
          );
          const uniqueServicios = Array.from(
            new Map(activeServicios.map((servicio) => [servicio.id, servicio])).values()
          );

          setClientes(uniqueClientes);
          setServicios(uniqueServicios);
        }
      } catch (error) {
        if (isMounted) {
          setClientesError("No se pudieron cargar los clientes.");
          setServiciosError("No se pudieron cargar los servicios.");
        }
      } finally {
        if (isMounted) {
          setClientesLoading(false);
          setServiciosLoading(false);
        }
      }
    };

    void loadClientesYServicios();

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Cargar información de si cada servicio tiene items asociados activos
  useEffect(() => {
    if (!open || !servicios.length) {
      return;
    }

    let isMounted = true;

    const loadServiciosItemsInfo = async () => {
      try {
        const results = await Promise.all(
          servicios.map(async (servicio) => {
            try {
              const { items } = await getItemsService(servicio.id);
              const activos = items.filter((item) => item.is_active);
              return [servicio.id, activos.length > 0] as const;
            } catch (error) {
              return [servicio.id, false] as const;
            }
          })
        );

        if (!isMounted) return;

        const map: Record<string, boolean> = {};
        for (const [id, hasItems] of results) {
          map[id] = hasItems;
        }
        setServiciosConItems(map);
      } catch (error) {
        // Error al cargar info de items, se ignora
      }
    };

    void loadServiciosItemsInfo();

    return () => {
      isMounted = false;
    };
  }, [open, servicios]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedServicioId) {
      setServicioItems([]);
      setItemsError(null);
      setItemsLoading(false);
      if (form.getValues("items").length) {
        form.setValue("items", [], { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    let isMounted = true;
    setItemsLoading(true);
    setItemsError(null);

    getItemsService(selectedServicioId)
      .then(({ items }) => {
        if (!isMounted) return;
        const activos = items.filter((item) => item.is_active);
        setServicioItems(activos);

        const currentItems = form.getValues("items");
        const filteredItems = currentItems.filter((itemId) =>
          activos.some((item) => item.id === itemId)
        );

        const userModifiedItems = !!form.formState.dirtyFields.items;
        if (userModifiedItems) {
          return;
        }

        const nextItems = filteredItems.length > 0 ? filteredItems : activos.map((item) => item.id);
        form.setValue("items", nextItems, { shouldDirty: false, shouldValidate: true });
      })
      .catch((error) => {
        if (!isMounted) return;
        setItemsError("No se pudieron cargar los items del servicio seleccionado.");
        setServicioItems([]);
        form.setValue("items", [], { shouldDirty: true, shouldValidate: true });
      })
      .finally(() => {
        if (!isMounted) return;
        setItemsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, selectedServicioId, form]);

  const servicioSeleccionado = useMemo(
    () => servicios.find((servicio) => servicio.id === selectedServicioId),
    [servicios, selectedServicioId]
  );

  const handleSubmit = async (data: PropuestaFormData) => {
    const normalizedDate = data.vigencia ? parseDateOnlyToLocalNoon(data.vigencia) : null;
    const payload = {
      ...data,
      valor: Number(data.valor),
      vigencia: normalizedDate ? toDateOnlyString(normalizedDate) : null,
      is_active: propuesta?.is_active ?? true,
    };

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      // Error ya manejado por el componente padre
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Propuesta" : "Crear Nueva Propuesta"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la propuesta."
              : "Completa los datos para crear una nueva propuesta."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Codigo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Codigo de la propuesta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vigencia"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Vigencia *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Seleccioná una fecha"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl className="w-full">
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value || undefined}
                        disabled={clientesLoading || !!clientesError}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              clientesLoading ? "Cargando clientes..." : "Seleccioná un cliente"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {clientesError ? (
                      <p className="text-sm text-destructive">{clientesError}</p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="servicioId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Servicio *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        value={field.value || undefined}
                        disabled={serviciosLoading || !!serviciosError}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              serviciosLoading ? "Cargando servicios..." : "Seleccioná un servicio"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {servicios.map((servicio) => {
                            const hasItems = serviciosConItems[servicio.id];
                            const disabled =
                              hasItems === false && servicio.id !== selectedServicioId;

                            return (
                              <SelectItem key={servicio.id} value={servicio.id} disabled={disabled}>
                                {servicio.name} -{" "}
                                <Badge variant="outline" className="bg-white capitalize">
                                  {servicio.type}
                                </Badge>
                                {hasItems === false && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    Servicio sin items asociados
                                  </span>
                                )}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {serviciosError ? (
                      <p className="text-sm text-destructive">{serviciosError}</p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del contacto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ingresá el valor"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Moneda *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccioná una moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONEDA_OPTIONS.map((moneda) => (
                            <SelectItem key={moneda} value={moneda}>
                              {moneda}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná un estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="items"
                render={({ field }) => {
                  const selectedItems = field.value ?? [];

                  return (
                    <FormItem className="col-span-2">
                      <FormLabel>Items *</FormLabel>
                      <FormControl>
                        <div className="space-y-3 rounded-md border border-border p-3">
                          {!selectedServicioId ? (
                            <p className="text-sm text-muted-foreground">
                              Seleccioná un servicio para ver sus items disponibles.
                            </p>
                          ) : itemsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando items...
                            </div>
                          ) : itemsError ? (
                            <p className="text-sm text-destructive">{itemsError}</p>
                          ) : servicioItems.length ? (
                            <div className="space-y-4">
                              {/* Agregar Items - Select */}
                              <div className="space-y-2">
                                <Label htmlFor="add-item" className="text-sm font-semibold">
                                  Agregar Item
                                </Label>
                                <Select
                                  value=""
                                  onValueChange={(itemId) => {
                                    const current = form.getValues("items");
                                    if (itemId && !current.includes(itemId)) {
                                      field.onChange([...current, itemId]);
                                    }
                                  }}
                                >
                                  <SelectTrigger id="add-item">
                                    <SelectValue placeholder="Seleccioná un item para agregar" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {servicioItems
                                      .filter((item) => !selectedItems.includes(item.id))
                                      .map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{item.name}</span>
                                            {item.description && (
                                              <span className="text-xs text-muted-foreground">
                                                {item.description}
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    {servicioItems.filter(
                                      (item) => !selectedItems.includes(item.id)
                                    ).length === 0 && (
                                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        Todos los items ya están seleccionados
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Items Seleccionados - Drag & Drop */}
                              {selectedItems.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">
                                    Items Seleccionados (arrastrá para ordenar)
                                  </p>
                                  <SortableItemsList
                                    items={servicioItems}
                                    selectedItemIds={selectedItems}
                                    onReorder={(newOrder) => field.onChange(newOrder)}
                                    onRemove={(itemId) => {
                                      const current = form.getValues("items");
                                      field.onChange(current.filter((id) => id !== itemId));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {servicioSeleccionado
                                ? `El servicio "${servicioSeleccionado.name}" no tiene items asociados activos.`
                                : "No hay items disponibles para el servicio seleccionado."}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      {itemsLoading ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando items del servicio seleccionado...
                        </p>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="condicionesParticulares"
                render={({ field }) => {
                  const selected = field.value ?? [];

                  return (
                    <FormItem className="col-span-2">
                      <FormLabel>Condiciones particulares *</FormLabel>
                      <FormControl>
                        <div className="space-y-4 rounded-md border border-border p-3 grid grid-cols-2 gap-4">
                          {condicionesParticularesGrouped.map(([type, condiciones]) => (
                            <div key={type} className="space-y-2">
                              <div className="text-sm font-semibold">{type}</div>
                              <div className="space-y-2">
                                {condiciones.map((condicion) => {
                                  const value = condicion.description;
                                  const checked = selected.includes(value);

                                  return (
                                    <div
                                      key={condicion.id}
                                      className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                                    >
                                      <div className="flex flex-1 items-start gap-2">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(value) => {
                                            if (value === true) {
                                              field.onChange([...selected, condicion.description]);
                                              return;
                                            }

                                            field.onChange(
                                              selected.filter((x) => x !== condicion.description)
                                            );
                                          }}
                                        />
                                        <div>
                                          <p className="text-sm font-medium">{condicion.title}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {condicion.description}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Crear Propuesta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
