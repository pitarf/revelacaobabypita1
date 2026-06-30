import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { site, event, payment } = await req.json();

    if (!event) {
      return NextResponse.json({ error: "Configurações de evento não enviadas." }, { status: 400 });
    }

    // Executa atualizações em transação atômica
    await prisma.$transaction(async (tx) => {
      // 1. Atualiza configurações do Evento
      const currentEvent = await tx.eventSetting.findFirst();
      if (currentEvent) {
        await tx.eventSetting.update({
          where: { id: currentEvent.id },
          data: {
            title: event.title,
            babyOption1: event.babyOption1,
            babyOption2: event.babyOption2,
            eventDate: new Date(event.eventDate),
            eventTime: event.eventTime,
            locationName: event.locationName,
            address: event.address,
            googleMapsUrl: event.googleMapsUrl || null,
            deliveryAddress: event.deliveryAddress || null,
            showCountdown: event.showCountdown,
          },
        });
      }

      // Atualiza SiteSettings
      const currentSite = await tx.siteSetting.findFirst();
      if (currentSite) {
        let themeObj: any = {};
        try {
          themeObj = currentSite.themeJson ? JSON.parse(currentSite.themeJson) : {};
        } catch (e) {
          themeObj = {};
        }
        
        // Mantém propriedades anteriores e aplica novas
        themeObj.hideVotingResults = !!event.hideResults;
        
        if (site && site.themeJson) {
          try {
            const newTheme = JSON.parse(site.themeJson);
            themeObj = { ...themeObj, ...newTheme };
          } catch (e) {}
        }
        
        await tx.siteSetting.update({
          where: { id: currentSite.id },
          data: {
            siteTitle: site ? site.siteTitle : currentSite.siteTitle,
            faviconUrl: site ? site.faviconUrl : currentSite.faviconUrl,
            themeJson: JSON.stringify(themeObj),
          },
        });
      }

      // 2. Atualiza configurações de Pagamento (se enviado)
      if (payment) {
        const currentPayment = await tx.paymentSetting.findFirst();
        if (currentPayment) {
          await tx.paymentSetting.update({
            where: { id: currentPayment.id },
            data: {
              mpAccessToken: payment.mpAccessToken || null,
              pixKey: payment.pixKey || null,
              maxInstallments: parseInt(payment.cardInstallmentsLimit || "5"),
              feePolicy: payment.cardFeeAbsorbed ? "absorb" : "add_to_customer",
            },
          });
        }
      }
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "UPDATE_SYSTEM_SETTINGS",
        details: "Atualizou configurações gerais do evento e de pagamentos.",
      },
    });

    return NextResponse.json({ success: true, message: "Configurações gerais atualizadas!" });

  } catch (error) {
    console.error("Erro no PUT admin/settings:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
