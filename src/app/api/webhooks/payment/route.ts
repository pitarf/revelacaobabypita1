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

    // 2. PROCESSAMENTO REAL DO WEBHOOK DO MERCADO PAGO
    // O Mercado Pago notifica enviando o ID do recurso (payment) no body ou params
    const paymentId = body.data?.id || searchParams.get("data.id") || searchParams.get("id");
    const type = body.type || searchParams.get("type") || searchParams.get("topic");

    if (type === "payment" && paymentId) {
      // Busca as chaves de API configuradas no banco
      const settings = await prisma.paymentSetting.findFirst();
      const accessToken = settings?.mpAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN;

      if (!accessToken) {
        console.warn("Mercado Pago Access Token não configurado. Ignorando notificação de webhook.");
        return NextResponse.json({ message: "Webhook ignorado (Access Token ausente)." }, { status: 200 });
      }

      // Consulta o status de pagamento atualizado na API do Mercado Pago
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Erro ao consultar pagamento no Mercado Pago: ${response.statusText}`);
        return NextResponse.json({ error: "Erro ao consultar gateway." }, { status: 500 });
      }

      const paymentData = await response.json();
      const orderCodeFromMP = paymentData.external_reference; // Contém o código CHA-XXXXXX

      if (!orderCodeFromMP) {
        console.warn("Pagamento sem external_reference (código do pedido). Ignorando.");
        return NextResponse.json({ message: "Pedido correspondente não identificado." }, { status: 200 });
      }

      const order = await prisma.order.findUnique({
        where: { code: orderCodeFromMP },
        include: { orderItems: true },
      });

      if (!order) {
        console.warn(`Pedido com código ${orderCodeFromMP} não encontrado.`);
        return NextResponse.json({ message: "Pedido não encontrado." }, { status: 200 });
      }

      const status = paymentData.status; // approved, pending, in_process, rejected, cancelled, refunded

      // Calcula as taxas reais do Mercado Pago
      // fee_details detalha as taxas aplicadas
      let feeValue = 0;
      let netValue = parseFloat(order.totalValue.toString());
      if (paymentData.fee_details) {
        for (const fee of paymentData.fee_details) {
          feeValue += parseFloat(fee.amount || 0);
        }
        netValue = Math.max(0, netValue - feeValue);
      }

      if (status === "approved") {
        await approveOrderPayment(order.id, String(paymentId), JSON.stringify(paymentData), {
          net: netValue,
          fee: feeValue,
        });
        
        // Envia e-mail de confirmação apenas quando o pagamento for aprovado
        const giftNames = order.orderItems.map(item => item.name).join(", ");
        sendGiftConfirmation(
          order.gifterEmail,
          order.gifterName,
          order.code,
          order.paymentMethod,
          "approved",
          giftNames
        ).catch(console.error);

        console.log(`✔ Pedido ${order.code} aprovado via Webhook.`);
      } else if (status === "cancelled" || status === "rejected" || status === "refunded") {
        const targetStatus = status === "refunded" ? "refunded" : "cancelled";
        await rollbackGiftInventory(order.id, targetStatus);
        
        // Atualiza a transação correspondente
        const paymentRecord = await prisma.payment.findFirst({ where: { orderId: order.id } });
        if (paymentRecord) {
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: targetStatus, rawPayload: JSON.stringify(paymentData) },
          });
        }
        console.log(`✖ Pedido ${order.code} cancelado/estornado via Webhook e estoque devolvido.`);
      }

      return NextResponse.json({ success: true });
    }

    // Retorna 200 OK para o Mercado Pago validar o recebimento da rota em testes iniciais
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
