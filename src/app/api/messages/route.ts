import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/messages - Retorna todos os recados ordenados pelos mais recentes
export async function GET() {
  try {
    const messages = await prisma.guestMessage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Erro ao obter recados:", error);
    return NextResponse.json({ error: "Erro ao carregar mural de recados." }, { status: 500 });
  }
}

// POST /api/messages - Cria um novo recado
export async function POST(req: NextRequest) {
  try {
    const { name, message } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Por favor, informe seu nome." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Por favor, escreva uma mensagem de carinho." }, { status: 400 });
    }

    if (message.trim().length > 500) {
      return NextResponse.json({ error: "Sua mensagem é muito longa (máximo 500 caracteres)." }, { status: 400 });
    }

    const newMessage = await prisma.guestMessage.create({
      data: {
        name: name.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Erro ao registrar recado:", error);
    return NextResponse.json({ error: "Servidor instável. Tente novamente em alguns instantes." }, { status: 500 });
  }
}
