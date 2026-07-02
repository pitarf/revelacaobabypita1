import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const guests = await prisma.guest.findMany({
      include: {
        rsvp: true,
      },
      orderBy: [
        { group: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Erro ao buscar convidados:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, group, rsvpId } = body;

    if (!name) {
      return NextResponse.json({ error: "O nome é obrigatório" }, { status: 400 });
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        group: group || null,
        rsvpId: rsvpId || null,
      },
      include: {
        rsvp: true
      }
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar convidado:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
