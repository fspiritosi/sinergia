import prisma from "@/lib/db";
import { NextResponse } from "next/server";

type ParamsPromise = Promise<{ provinciaId: string }>;

export async function GET(_request: Request, { params }: { params: ParamsPromise }) {
  const { provinciaId } = await params;
  const ciudades = await prisma.ciudad.findMany({
    where: { provinciaId },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(ciudades);
}

export async function POST(request: Request, { params }: { params: ParamsPromise }) {
  const { provinciaId } = await params;
  const body = await request.json();
  const nombreRaw = (body?.nombre ?? "").toString().trim();
  if (!nombreRaw) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  const nombre = (() => {
    const normalized = nombreRaw.toLowerCase().replace(/\s+/g, " ");
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  })();

  const exists = await prisma.ciudad.findFirst({
    where: {
      provinciaId,
      nombre: { equals: nombre, mode: "insensitive" },
    },
  });
  if (exists) {
    return NextResponse.json({ error: "Ciudad ya existe en la provincia" }, { status: 409 });
  }

  const ciudad = await prisma.ciudad.create({
    data: { nombre, provinciaId },
  });
  return NextResponse.json(ciudad, { status: 201 });
}
