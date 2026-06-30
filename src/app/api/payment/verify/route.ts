import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGiftConfirmation } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const orderCode = req.nextUrl.searchParams.get("orderCode");

    if (!orderCode) {
      return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { code: orderCode },
      include: {
        payments: true,
        orderItems: { include: { gift: true } }
      }
    });

    if (!order || order.payments.length === 0) {
      return NextResponse.json({ error: "Order or Payment not found" }, { status: 404 });
    }

    if (order.paymentStatus === "approved") {
      return NextResponse.json({ status: "approved" });
    }

    const payment = order.payments[0];

    // Verifica apenas se for PIX via PushinPay
    if (order.paymentMethod === "pix" && payment.transactionId) {
      const token = process.env.PUSHINPAY_TOKEN;
      if (!token) {
        return NextResponse.json({ error: "PushinPay Token not configured" }, { status: 500 });
      }

      // Evita consultar o mock do simulador na API real
      if (payment.transactionId.startsWith("sim_")) {
        return NextResponse.json({ status: "pending" });
      }

      const pushinpayRes = await fetch(`https://api.pushinpay.com.br/api/transactions/${payment.transactionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      // Se falhar e a PushinPay devolver 404 para transactions no plural, tentar transaction no singular
      let statusData = null;
      if (pushinpayRes.ok) {
        statusData = await pushinpayRes.json();
      } else {
        const retryRes = await fetch(`https://api.pushinpay.com.br/api/transaction/${payment.transactionId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        if (retryRes.ok) {
          statusData = await retryRes.json();
        } else if (retryRes.status === 404) {
          return NextResponse.json({ status: "pending" });
        } else {
          throw new Error(`PushinPay API Error: ${retryRes.status}`);
        }
      }
      
      if (statusData && (statusData.status === "paid" || statusData.status === "approved")) {
        // Aprova o pagamento
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "approved",
              netValue: Number(payment.value) - 1.99,
              feeValue: 1.99,
            }
          });

          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: "approved" }
          });

          for (const item of order.orderItems) {
            await tx.gift.update({
              where: { id: item.giftId },
              data: { chosenQuantity: { increment: item.quantity } }
            });
          }
        });

        // Enviar email
        try {
          const giftNames = order.orderItems.map(i => i.name).join(", ");
          await sendGiftConfirmation(
            order.gifterEmail,
            order.gifterName,
            order.code,
            order.paymentMethod,
            "approved",
            giftNames
          );
        } catch (err) {
          console.error("[Verify API] Erro ao enviar email:", err);
        }

        return NextResponse.json({ status: "approved" });
      }
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("[Verify API] Erro na verificação:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
