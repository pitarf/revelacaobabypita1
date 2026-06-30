import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGiftConfirmation } from "@/lib/email";

/**
 * Função auxiliar para devolver o estoque dos presentes vinculados a um pedido cancelado/reembolsado
 */
async function rollbackGiftInventory(orderId: string, newStatus: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new Error(`Pedido com ID ${orderId} não encontrado para estorno.`);
    }

    // Se o pedido já foi cancelado ou reembolsado, pula para evitar estorno duplicado
    if (order.paymentStatus === "cancelled" || order.paymentStatus === "refunded") {
      return order;
    }

    // Devolve o estoque de cada presente associado
    for (const item of order.orderItems) {
      const gift = await tx.gift.findUnique({
        where: { id: item.giftId },
      });

      if (gift) {
        const newChosenQty = Math.max(0, gift.chosenQuantity - item.quantity);
        await tx.gift.update({
          where: { id: gift.id },
          data: {
            chosenQuantity: newChosenQty,
            status: "available", // ao devolver estoque, volta a ficar disponível
          },
        });
      }
    }

    // Atualiza o status do pedido
    return await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newStatus,
        deliveryStatus: "cancelled", // pedido cancelado não precisa ser entregue
      },
    });
  });
}

/**
 * Confirma e aprova o pagamento de um pedido
 */
async function approveOrderPayment(orderId: string, transactionId: string, rawPayload?: string, fees?: { net: number, fee: number }) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Pedido com ID ${orderId} não encontrado para aprovação.`);
    }

    // Atualiza o status de pagamento do pedido para aprovado
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "approved",
      },
    });

    // Se a forma de presentear for online (pix ou card), marca como entregue (pois o dinheiro foi repassado)
    // Se for 'personal' (levar pessoalmente), quem confirma a entrega física é o admin no painel
    const newDeliveryStatus = order.paymentMethod === "pix" || order.paymentMethod === "card" 
      ? "delivered" 
      : "pending";

    await tx.order.update({
      where: { id: order.id },
      data: {
        deliveryStatus: newDeliveryStatus,
      },
    });

    // Atualiza a transação na tabela de pagamentos
    const payment = await tx.payment.findFirst({
      where: { orderId: order.id },
    });

    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "approved",
          transactionId: transactionId,
          rawPayload: rawPayload || null,
          netValue: fees ? fees.net : payment.value,
          feeValue: fees ? fees.fee : 0,
        },
      });
    }

    return order;
  });
}

// POST /api/webhooks/payment - Endpoint receptor de notificações
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);

    // 1. SUPORTE A SIMULAÇÕES DE TESTE (Dashboard Admin ou Conclusão)
    // Facilita testes locais rápidos sem precisar expor portas via ngrok/túnel externo
    const action = body.action || searchParams.get("action");
    const orderCode = body.orderCode || searchParams.get("orderCode");

    if (action && orderCode) {
      const order = await prisma.order.findUnique({
        where: { code: orderCode },
      });

      if (!order) {
        return NextResponse.json({ error: "Pedido não encontrado no simulador." }, { status: 404 });
      }

      if (action === "simulated_approve") {
        await approveOrderPayment(order.id, `sim_tx_${Date.now()}`, JSON.stringify(body));
        return NextResponse.json({ success: true, message: "Simulação: Pedido APROVADO com sucesso!" });
      }

      if (action === "simulated_cancel") {
        await rollbackGiftInventory(order.id, "cancelled");
        return NextResponse.json({ success: true, message: "Simulação: Pedido CANCELADO e estoque devolvido!" });
      }
    }

    // 2. PROCESSAMENTO REAL DO WEBHOOK DO PAGSEGURO
    // O PagSeguro (API v4) envia o objeto Order completo no body da notificação
    const orderIdGateway = body.id;
    const orderCodeFromGateway = body.reference_id;
    const charges = body.charges || [];

    if (orderIdGateway && orderCodeFromGateway) {
      const order = await prisma.order.findUnique({
        where: { code: orderCodeFromGateway },
        include: { orderItems: true },
      });

      if (!order) {
        console.warn(`Pedido com código ${orderCodeFromGateway} não encontrado.`);
        return NextResponse.json({ message: "Pedido não encontrado." }, { status: 200 });
      }

      // Se houver cobranças (charges), pegamos o status da cobrança principal
      // Status possíveis no PagSeguro: AUTHORIZED, PAID, DECLINED, CANCELED
      const mainCharge = charges[0];
      const status = mainCharge ? mainCharge.status : body.status; // fallback para o status do pedido se não houver charge

      // A taxa (fee) não costuma vir de forma tão clara no webhook do v4 (depende de configuração de split),
      // mas podemos registrar o netValue estimado ou deixar 0 para cálculo manual no painel
      let feeValue = 0;
      let netValue = parseFloat(order.totalValue.toString());

      if (status === "PAID") {
        await approveOrderPayment(order.id, String(orderIdGateway), JSON.stringify(body), {
          net: netValue,
          fee: feeValue,
        });
        
        // Envia e-mail de confirmação apenas quando o pagamento for aprovado
        const giftNames = order.orderItems.map(item => item.name).join(", ");
        try {
          await sendGiftConfirmation(
            order.gifterEmail,
            order.gifterName,
            order.code,
            order.paymentMethod,
            "approved",
            giftNames
          );
        } catch (emailError) {
          console.error("Erro ao enviar email de confirmação no webhook:", emailError);
        }

        console.log(`✔ Pedido ${order.code} aprovado via Webhook PagSeguro.`);
      } else if (status === "CANCELED" || status === "DECLINED" || status === "REFUNDED") {
        const targetStatus = status === "REFUNDED" ? "refunded" : "cancelled";
        await rollbackGiftInventory(order.id, targetStatus);
        
        // Atualiza a transação correspondente
        const paymentRecord = await prisma.payment.findFirst({ where: { orderId: order.id } });
        if (paymentRecord) {
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: targetStatus, rawPayload: JSON.stringify(body) },
          });
        }
        console.log(`✖ Pedido ${order.code} cancelado/estornado via Webhook e estoque devolvido.`);
      }

      return NextResponse.json({ success: true });
    }

    // Retorna 200 OK para o PagSeguro validar o recebimento da rota
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return NextResponse.json({ error: "Erro interno ao processar webhook." }, { status: 500 });
  }
}

// GET /api/webhooks/payment - Para validação inicial de rota pelo gateway
export async function GET() {
  return NextResponse.json({ status: "Webhook ativo e operacional." });
}
