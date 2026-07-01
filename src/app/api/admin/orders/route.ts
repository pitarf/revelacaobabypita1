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

    const { id, ids, action, deliveryStatus } = await req.json();
    const idsToProcess = ids || (id ? [id] : []);

    if (idsToProcess.length === 0) {
      return NextResponse.json({ error: "IDs dos pedidos não fornecidos." }, { status: 400 });
    }

    // 1. AÇÃO: Aprovar Pagamento Manualmente
    if (action === "approve_payment") {
      let approvedCount = 0;
      for (const currentId of idsToProcess) {
        const order = await prisma.order.findUnique({
          where: { id: currentId },
          include: { payments: true, orderItems: true },
        });

        if (!order || order.paymentStatus === "approved") continue;

        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: currentId },
            data: { paymentStatus: "approved" },
          });

          await tx.payment.updateMany({
            where: { orderId: currentId, status: "pending" },
            data: { status: "approved", netValue: order.totalValue, feeValue: 0 },
          });

          for (const item of order.orderItems) {
            await tx.gift.update({
              where: { id: item.giftId },
              data: { chosenQuantity: { increment: item.quantity } },
            });
          }
        });

        await prisma.auditLog.create({
          data: {
            adminId: session.id,
            action: "MANUAL_APPROVE_PAYMENT",
            details: `Aprovou manualmente o pagamento do pedido Código ${order.code}`,
          },
        });
        approvedCount++;
      }

      return NextResponse.json({ success: true, message: `${approvedCount} pagamento(s) aprovado(s) manualmente.` });
    }

    // 2. AÇÃO: Atualizar Status de Entrega Física
    if (deliveryStatus) {
      const updatedCount = await prisma.order.updateMany({
        where: { id: { in: idsToProcess } },
        data: { deliveryStatus },
      });

      await prisma.auditLog.create({
        data: {
          adminId: session.id,
          action: "UPDATE_DELIVERY_STATUS_BULK",
          details: `Atualizou entrega de ${updatedCount.count} pedido(s) para ${deliveryStatus}`,
        },
      });

      return NextResponse.json({ success: true, count: updatedCount.count });
    }

    return NextResponse.json({ error: "Ação não especificada." }, { status: 400 });

  } catch (error) {
    console.error("Erro no PUT admin/orders:", error);
    return NextResponse.json({ error: "Erro ao modificar pedido." }, { status: 500 });
  }
}

// DELETE: Exclui um pedido permanentemente
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const singleId = searchParams.get("id");
    const bulkIds = searchParams.getAll("ids[]");
    
    // Also accept body for bulk delete if provided
    let bodyIds: string[] = [];
    try {
      const body = await req.json();
      if (body && body.ids) bodyIds = body.ids;
    } catch (e) {
      // ignore JSON parse error for DELETE requests without body
    }

    const idsToProcess = bulkIds.length > 0 ? bulkIds : (bodyIds.length > 0 ? bodyIds : (singleId ? [singleId] : []));

    if (idsToProcess.length === 0) {
      return NextResponse.json({ error: "IDs não fornecidos." }, { status: 400 });
    }

    let deletedCount = 0;
    for (const currentId of idsToProcess) {
      const order = await prisma.order.findUnique({
        where: { id: currentId },
        include: { orderItems: true },
      });

      if (!order) continue;

      await prisma.$transaction(async (tx) => {
        // Devolver o estoque (reservado no checkout) independente do status de aprovação
        for (const item of order.orderItems) {
          await tx.gift.update({
            where: { id: item.giftId },
            data: { chosenQuantity: { decrement: item.quantity } },
          });
        }

        await tx.orderItem.deleteMany({ where: { orderId: currentId } });
        await tx.payment.deleteMany({ where: { orderId: currentId } });
        await tx.order.delete({ where: { id: currentId } });
      });

      await prisma.auditLog.create({
        data: {
          adminId: session.id,
          action: "DELETE_ORDER",
          details: `Excluiu permanentemente o pedido Código ${order.code}`,
        },
      });
      deletedCount++;
    }

    return NextResponse.json({ success: true, message: `${deletedCount} pedido(s) excluído(s) com sucesso.` });
  } catch (error) {
    console.error("Erro no DELETE admin/orders:", error);
    return NextResponse.json({ error: "Erro ao excluir pedido(s)." }, { status: 500 });
  }
}
