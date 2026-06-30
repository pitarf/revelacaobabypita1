import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todos os pedidos de presentes do banco de dados
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            gift: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((ord) => ({
      ...ord,
      totalValue: parseFloat(ord.totalValue.toString()),
      orderItems: ord.orderItems.map((item) => ({
        ...item,
        priceAtPurchase: parseFloat(item.priceAtPurchase.toString()),
      })),
      payments: ord.payments.map((p) => ({
        ...p,
        value: parseFloat(p.value.toString()),
        feeValue: p.feeValue ? parseFloat(p.feeValue.toString()) : 0,
        netValue: p.netValue ? parseFloat(p.netValue.toString()) : 0,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erro no GET admin/orders:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// PUT: Atualiza status do pedido (Aprovar Pagamento Manual ou Entrega Física)
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id, action, deliveryStatus } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID do pedido não fornecido." }, { status: 400 });
    }

    // 1. AÇÃO: Aprovar Pagamento Manualmente
    if (action === "approve_payment") {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { payments: true, orderItems: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Pedido não localizado." }, { status: 404 });
      }

      if (order.paymentStatus === "approved") {
        return NextResponse.json({ error: "Este pedido já está aprovado." }, { status: 400 });
      }

      // Executa transação atômica
      await prisma.$transaction(async (tx) => {
        // Atualiza status do pedido
        await tx.order.update({
          where: { id },
          data: { paymentStatus: "approved" },
        });

        // Atualiza os pagamentos pendentes associados
        await tx.payment.updateMany({
          where: { orderId: id, status: "pending" },
          data: {
            status: "approved",
            // Em aprovação manual, taxas são nulas e o líquido é igual ao bruto
            netValue: order.totalValue,
            feeValue: 0,
          },
        });

        // Atualiza a quantidade escolhida real do presente (estoque)
        for (const item of order.orderItems) {
          await tx.gift.update({
            where: { id: item.giftId },
            data: {
              chosenQuantity: { increment: item.quantity },
            },
          });
        }
      });

      // Auditoria
      await prisma.auditLog.create({
        data: {
          adminId: session.id,
          action: "MANUAL_APPROVE_PAYMENT",
          details: `Aprovou manualmente o pagamento do pedido Código ${order.code}`,
        },
      });

      return NextResponse.json({ success: true, message: "Pagamento aprovado manualmente." });
    }

    // 2. AÇÃO: Atualizar Status de Entrega Física
    if (deliveryStatus) {
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        return NextResponse.json({ error: "Pedido não localizado." }, { status: 404 });
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { deliveryStatus },
      });

      // Auditoria
      await prisma.auditLog.create({
        data: {
          adminId: session.id,
          action: "UPDATE_DELIVERY_STATUS",
          details: `Atualizou entrega do pedido ${order.code} para ${deliveryStatus}`,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Ação não especificada." }, { status: 400 });

  } catch (error) {
    console.error("Erro no PUT admin/orders:", error);
    return NextResponse.json({ error: "Erro ao modificar pedido." }, { status: 500 });
  }
}
