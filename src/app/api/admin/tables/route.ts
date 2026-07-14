import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        guests: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(tables);
  } catch (error: any) {
    console.error("Erro ao buscar mesas:", error);
    return NextResponse.json(
      { error: "Falha ao buscar mesas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, capacity } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nome da mesa é obrigatório." },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        name,
        capacity: Number(capacity) || 4,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar mesa:", error);
    return NextResponse.json(
      { error: "Falha ao criar mesa." },
      { status: 500 }
    );
  }
}
