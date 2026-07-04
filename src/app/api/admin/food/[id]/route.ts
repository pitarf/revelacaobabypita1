import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// PUT: Atualiza um item existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, quantity, isPurchased, amountSpent, isReady, supplier, deliveryDate } = body;

    const updatedItem = await prisma.foodAndDrink.update({
      where: { id },
      data: {
        name,
        quantity,
        isPurchased: Boolean(isPurchased),
        amountSpent: amountSpent ? parseFloat(amountSpent) : null,
        isReady: Boolean(isReady),
        supplier: supplier || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      },
    });

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("Erro ao atualizar comida/bebida:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// DELETE: Remove um item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;

    await prisma.foodAndDrink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Item removido com sucesso." });
  } catch (error) {
    console.error("Erro ao remover comida/bebida:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
