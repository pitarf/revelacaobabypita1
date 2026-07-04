import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todos os itens de comida e bebida
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const items = await prisma.foodAndDrink.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao listar comidas/bebidas:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST: Cria um novo item
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { name, quantity, isPurchased, amountSpent, isReady, supplier, deliveryDate, isMarketList, marketItems } = body;

    if (!name || !quantity) {
      return NextResponse.json({ error: "Nome e Quantidade são obrigatórios." }, { status: 400 });
    }

    const newItem = await prisma.foodAndDrink.create({
      data: {
        name,
        quantity,
        isPurchased: Boolean(isPurchased),
        amountSpent: amountSpent ? parseFloat(amountSpent) : null,
        isReady: Boolean(isReady),
        supplier: supplier || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        isMarketList: Boolean(isMarketList),
        marketItems: marketItems || null,
      },
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar comida/bebida:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
