"use server";

import { clienteRepository } from "@/repositories/cliente.repository";

export async function getClientes() {
  return clienteRepository.findMany();
}

export async function getClientesPaginated(params: {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}) {
  return clienteRepository.findPaginated({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    filters: params.filters,
  });
}

export async function getClienteById(id: string) {
  return clienteRepository.findByIdWithDetails(id);
}

// Exportamos el tipo de retorno de la función
export type Cliente = Awaited<ReturnType<typeof getClientes>>[0];

export type ClienteById = Awaited<ReturnType<typeof getClienteById>>;
