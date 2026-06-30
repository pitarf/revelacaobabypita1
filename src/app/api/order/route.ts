import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Código do pedido não fornecido." }, { status: 400 });
    }

    // Busca o pedido com os itens, categorias dos presentes e informações de pagamento
    const order = await prisma.order.findUnique({
      where: { code },
      include: {
        orderItems: {
          include: {
            gift: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não localizado." }, { status: 404 });
    }

    // Formata os valores decimais para números antes de responder ao cliente
    const formattedOrder = {
      ...order,
      totalValue: parseFloat(order.totalValue.toString()),
      orderItems: order.orderItems.map((item) => ({
        ...item,
        priceAtPurchase: parseFloat(item.priceAtPurchase.toString()),
      })),
      payments: order.payments.map((pay) => ({
        ...pay,
        value: parseFloat(pay.value.toString()),
      })),
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
