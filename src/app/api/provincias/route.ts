import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const provincias = await prisma.provincia.findMany({
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(provincias);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nombreRaw = (body?.nombre ?? "").toString().trim();
  if (!nombreRaw) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  const nombre = (() => {
    const normalized = nombreRaw.toLowerCase().replace(/\s+/g, " ");
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  })();

  const exists = await prisma.provincia.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" } },
  });
  if (exists) {
    return NextResponse.json({ error: "Provincia ya existe" }, { status: 409 });
  }

  const provincia = await prisma.provincia.create({
    data: { nombre },
  });
  return NextResponse.json(provincia, { status: 201 });
}
