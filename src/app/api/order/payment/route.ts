import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixPayment, createCardPreference } from "@/services/payment";

export async function POST(req: NextRequest) {
  try {
    const { orderCode, paymentMethod } = await req.json();

    if (!orderCode || !paymentMethod) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { code: orderCode },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não localizado." }, { status: 404 });
    }

    if (order.paymentStatus === "approved") {
      return NextResponse.json({ error: "O pedido já está pago." }, { status: 400 });
    }

    // Atualiza a forma de pagamento no pedido
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod },
    });

    // Remove pagamentos anteriores pendentes para que o novo seja o principal
    await prisma.payment.deleteMany({
      where: { orderId: order.id, status: "pending" },
    });

    let paymentData: any = null;

    if (paymentMethod === "pix") {
      const pixResult = await createPixPayment(
        order.code,
        parseFloat(order.totalValue.toString()),
        order.gifterEmail,
        order.gifterName
      );

      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionId: pixResult.transactionId,
          status: pixResult.status,
          gateway: "mercadopago",
          value: order.totalValue,
          pixCopiaCola: pixResult.copiaCola,
          pixQrCode: pixResult.qrCode,
          pixQrCodeUrl: pixResult.qrCodeUrl,
        },
      });

      paymentData = {
        copiaCola: pixResult.copiaCola,
        qrCode: pixResult.qrCode,
        qrCodeUrl: pixResult.qrCodeUrl,
      };
    } else if (paymentMethod === "card") {
      const cardResult = await createCardPreference(
        order.code,
        parseFloat(order.totalValue.toString()),
        order.gifterEmail
      );

      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionId: cardResult.preferenceId,
          status: "pending",
          gateway: "mercadopago",
          value: order.totalValue,
        },
      });

      paymentData = {
        initPoint: cardResult.initPoint,
        preferenceId: cardResult.preferenceId,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Forma de pagamento atualizada com sucesso!",
      paymentMethod,
      payment: paymentData,
    });
  } catch (error) {
    console.error("Erro ao alterar forma de pagamento:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
