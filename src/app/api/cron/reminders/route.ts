import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPixReminder, sendEventReminder } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    // Validação de segurança sugerida pela Vercel Cron
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const results = {
      pixRemindersSent: 0,
      eventRemindersSent: 0,
    };

    // 1. Lembretes de Pix Pendentes (Há mais de 2 dias)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Buscar pedidos pendentes com pagamento PIX feitos até 2 dias atrás
    const pendingPixOrders = await prisma.order.findMany({
      where: {
        paymentMethod: "pix",
        paymentStatus: "pending",
        createdAt: {
          lte: twoDaysAgo,
        },
      },
      include: {
        orderItems: true,
      }
    });

    // Filtra no JS para pegar apenas os que tem entre 48h e 72h para não enviar todo dia
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const order of pendingPixOrders) {
      if (order.createdAt > threeDaysAgo) {
        // Enviar o primeiro item da lista de presentes
        const giftName = order.orderItems[0]?.name || "Presente";
        await sendPixReminder(order.gifterEmail, order.gifterName, order.code, giftName);
        results.pixRemindersSent++;
      }
    }

    // 2. Lembretes do Evento (3 dias antes)
    const eventSettings = await prisma.eventSetting.findFirst();
    if (eventSettings && eventSettings.eventDate) {
      const today = new Date();
      const eventDate = new Date(eventSettings.eventDate);
      
      const timeDiff = eventDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Se faltam exatos 3 dias
      if (daysLeft === 3) {
        // Buscar todos os RSVPs confirmados
        const rsvps = await prisma.rsvp.findMany({
          where: { status: "confirmed" }
        });

        // Formatar data e local
        const dateStr = eventDate.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' });
        const timeStr = eventSettings.eventTime;
        const dateTimeStr = `${dateStr} às ${timeStr}`;
        const locationStr = `${eventSettings.locationName} - ${eventSettings.address}`;
        const googleMapsUrl = eventSettings.googleMapsUrl || null;

        for (const rsvp of rsvps) {
          await sendEventReminder(rsvp.email, rsvp.fullName, eventSettings.title, dateTimeStr, locationStr, googleMapsUrl);
          results.eventRemindersSent++;
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error("Erro no Cron Job:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
