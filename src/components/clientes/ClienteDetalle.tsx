import { getClienteById, type ClienteById } from "./components/actions";
import { ClienteIdWrapper } from "./components/cliente-id-wrapper";
import { toDateOnlyString } from "@/lib/dates";

type BaseCliente = NonNullable<ClienteById>;

type SerializedPropuesta = {
  id: string;
  codigo: string;
  clienteId: string;
  servicioId: string;
  vigencia: string | null;
  status: BaseCliente["propuestas"][number]["status"];
  items: string[];
  contacto: string | null;
  valor: number;
  moneda: BaseCliente["propuestas"][number]["moneda"];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  cliente: { id: string; name: string } | null;
  servicios: { id: string; name: string; type: string } | null;
  condicionesParticulares: string[];
};

type SerializedClientLocation = {
  id: string;
  name: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  clienteId: string;
  cliente: { id: string; name: string } | null;
  provinciaId: string | null;
  ciudadId: string | null;
  provincia: { id: string; nombre: string } | null;
  ciudad: { id: string; nombre: string; provinciaId: string } | null;
};

type SerializedCliente = Omit<
  BaseCliente,
  "propuestas" | "clientLocations" | "createdAt" | "updatedAt" | "provincia" | "ciudad"
> & {
  propuestas: SerializedPropuesta[];
  clientLocations: SerializedClientLocation[];
  createdAt: string;
  updatedAt: string;
  provincia: { id: string; nombre: string } | null;
  ciudad: { id: string; nombre: string; provinciaId: string } | null;
};

function serializeCliente(cliente: BaseCliente): SerializedCliente {
  return {
    ...cliente,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
    provincia: cliente.provincia
      ? { id: cliente.provincia.id, nombre: cliente.provincia.nombre }
      : null,
    ciudad: cliente.ciudad
      ? {
          id: cliente.ciudad.id,
          nombre: cliente.ciudad.nombre,
          provinciaId: cliente.ciudad.provinciaId,
        }
      : null,
    propuestas: (cliente.propuestas ?? []).map<SerializedPropuesta>((p) => ({
      id: p.id,
      codigo: p.codigo,
      clienteId: p.clienteId,
      servicioId: p.servicioId,
      vigencia: p.vigencia ? toDateOnlyString(p.vigencia) : null,
      status: p.status,
      items: (p.items ?? []) as string[],
      contacto: p.contacto ?? null,
      valor: p.valor ? Number(p.valor) : 0,
      moneda: p.moneda,
      is_active: p.is_active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      cliente: p.cliente ? { id: p.cliente.id, name: p.cliente.name } : null,
      servicios: p.servicios
        ? { id: p.servicios.id, name: p.servicios.name, type: p.servicios.type }
        : null,
      condicionesParticulares: p.condicionesParticulares ?? [],
    })),
    clientLocations: (cliente.clientLocations ?? []).map<SerializedClientLocation>(
      (loc) => ({
        id: loc.id,
        name: loc.name,
        is_active: loc.is_active,
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
        clienteId: loc.clienteId,
        cliente: loc.cliente ? { id: loc.cliente.id, name: loc.cliente.name } : null,
        provinciaId: loc.provinciaId ?? null,
        ciudadId: loc.ciudadId ?? null,
        provincia: loc.provincia
          ? { id: loc.provincia.id, nombre: loc.provincia.nombre }
          : null,
        ciudad: loc.ciudad
          ? {
              id: loc.ciudad.id,
              nombre: loc.ciudad.nombre,
              provinciaId: loc.ciudad.provinciaId,
            }
          : null,
      })
    ),
  };
}

async function ClienteDetalle({ id }: { id: string }) {
  const cliente = await getClienteById(id);

  if (!cliente) {
    return <div>Cliente no encontrado</div>;
  }

  const serialized = serializeCliente(cliente);
  return <ClienteIdWrapper data={serialized} />;
}

export type { SerializedCliente };
export default ClienteDetalle;