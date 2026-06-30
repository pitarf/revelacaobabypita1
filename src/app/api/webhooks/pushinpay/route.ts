import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGiftConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Validação de segurança do Webhook
    const webhookToken = process.env.PUSHINPAY_WEBHOOK_TOKEN;
    
    if (webhookToken) {
      const allHeaders = Object.fromEntries(req.headers.entries());
      const headerValues = Object.values(allHeaders).join(" ");
      const urlToken = req.nextUrl.searchParams.get("token");

      if (!headerValues.includes(webhookToken) && urlToken !== webhookToken) {
        console.error("[Webhook PushinPay] Token inválido ou ausente. Headers:", allHeaders);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    console.log("[Webhook PushinPay] Notificação recebida:", body);

    const transactionId = body.transaction_id || body.id;
    const status = body.status;

    if (!transactionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status !== "paid" && status !== "approved") {
      return NextResponse.json({ message: "Ignored status" }, { status: 200 });
    }

    // Busca o pagamento
    const payment = await prisma.payment.findFirst({
      where: { transactionId },
      include: {
        order: {
          include: { orderItems: { include: { gift: true } } }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({ message: "Payment already approved" }, { status: 200 });
    }

    // Atualiza o banco via Transação Segura
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "approved",
          netValue: Number(payment.value) - 1.99, // Considerando taxa de 1.99 da PushinPay por PIX
          feeValue: 1.99,
        }
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "approved" }
      });

      for (const item of payment.order.orderItems) {
        await tx.gift.update({
          where: { id: item.giftId },
          data: { chosenQuantity: { increment: item.quantity } }
        });
      }
    });

    // Enviar email
    try {
      const giftNames = payment.order.orderItems.map(i => i.name).join(", ");
      await sendGiftConfirmation(
        payment.order.gifterEmail,
        payment.order.gifterName,
        payment.order.code,
        payment.order.paymentMethod,
        "approved",
        giftNames
      );
    } catch (err) {
      console.error("[Webhook PushinPay] Erro ao enviar email:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook PushinPay] Erro no processamento:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
