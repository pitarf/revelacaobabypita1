import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Proteção de Rota
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    // 2. Coleta de Métricas em paralelo no banco Neon
    const [
      eventSetting,
      totalVotesOption1,
      totalVotesOption2,
      rsvpsAggregates,
      financialAggregates,
      pendingFinancialAggregates,
      recentOrders,
      recentRsvps,
      topGifts,
    ] = await Promise.all([
      prisma.eventSetting.findFirst(),
      
      // Placar de Votos
      prisma.vote.count({ where: { babyName: "Miguel" } }),
      prisma.vote.count({ where: { babyName: "Rafaella" } }),
      
      // RSVPs Totais
      prisma.rsvp.groupBy({
        by: ["status"],
        _sum: {
          totalGuests: true,
          adultsCount: true,
          childrenCount: true,
        },
      }),

      // Finanças Recebidas (Pix + Cartão Aprovados)
      prisma.payment.aggregate({
        _sum: {
          value: true,
          netValue: true,
          feeValue: true,
        },
        where: {
          status: "approved",
        },
      }),

      // Finanças Pendentes
      prisma.payment.aggregate({
        _sum: {
          value: true,
        },
        where: {
          status: "pending",
        },
      }),

      // Pedidos Recentes
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { orderItems: true },
      }),

      // Confirmações Recentes
      prisma.rsvp.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),

      // Presentes Mais Escolhidos
      prisma.gift.findMany({
        take: 5,
        orderBy: { chosenQuantity: "desc" },
        where: { chosenQuantity: { gt: 0 } },
        include: { category: true },
      }),
    ]);

    // 3. Processamento das Configurações de Bebê
    const babyOption1 = eventSetting?.babyOption1 || "Miguel";
    const babyOption2 = eventSetting?.babyOption2 || "Rafaella";

    // 4. Processamento dos Grupos RSVP
    let confirmedGuests = 0;
    let confirmedAdults = 0;
    let confirmedChildren = 0;
    let totalRsvps = 0;

    rsvpsAggregates.forEach((group) => {
      const guests = group._sum.totalGuests || 0;
      const adults = group._sum.adultsCount || 0;
      const children = group._sum.childrenCount || 0;
      totalRsvps += guests;

      if (group.status === "confirmed") {
        confirmedGuests = guests;
        confirmedAdults = adults;
        confirmedChildren = children;
      }
    });

    // 5. Processamento dos Totais Financeiros
    const grossRevenue = parseFloat(financialAggregates._sum.value?.toString() || "0");
    const netRevenue = parseFloat(financialAggregates._sum.netValue?.toString() || "0");
    const gatewayFees = parseFloat(financialAggregates._sum.feeValue?.toString() || "0");
    const pendingRevenue = parseFloat(pendingFinancialAggregates._sum.value?.toString() || "0");

    // 6. Placar detalhado de votos
    const totalVotes = totalVotesOption1 + totalVotesOption2;
    const pctOption1 = totalVotes > 0 ? Math.round((totalVotesOption1 / totalVotes) * 100) : 50;
    const pctOption2 = totalVotes > 0 ? Math.round((totalVotesOption2 / totalVotes) * 100) : 50;

    return NextResponse.json({
      success: true,
      metrics: {
        rsvp: {
          confirmedGuests,
          confirmedAdults,
          confirmedChildren,
          totalRsvps,
        },
        votes: {
          option1: { name: babyOption1, count: totalVotesOption1, percentage: pctOption1 },
          option2: { name: babyOption2, count: totalVotesOption2, percentage: pctOption2 },
          total: totalVotes,
        },
        finance: {
          gross: grossRevenue,
          net: netRevenue,
          fees: gatewayFees,
          pending: pendingRevenue,
        },
      },
      recent: {
        orders: recentOrders.map((ord) => ({
          ...ord,
          totalValue: parseFloat(ord.totalValue.toString()),
        })),
        rsvps: recentRsvps,
        topGifts: topGifts.map((gift) => ({
          ...gift,
          value: parseFloat(gift.value.toString()),
        })),
      },
    });

  } catch (error) {
    console.error("Erro ao processar métricas do dashboard admin:", error);
    return NextResponse.json({ error: "Erro interno ao processar dados." }, { status: 500 });
  }
}
