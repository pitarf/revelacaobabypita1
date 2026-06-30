import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let siteSetting = await prisma.siteSetting.findFirst();

    // Migração automática em tempo de execução para atualizar a mensagem antiga com os novos negritos no banco de dados Neon
    if (siteSetting && (siteSetting.messageTitle === "Estamos esperando por você!" || !siteSetting.messageText.includes("barriga da mamãe"))) {
      try {
        siteSetting = await prisma.siteSetting.update({
          where: { id: siteSetting.id },
          data: {
            messageTitle: "Oi, queridos amigos e familiares!",
            messageText: "Eu ainda estou bem quentinho aqui na <strong>barriga da mamãe</strong>, mas já sinto todo o <strong>amor</strong> e <strong>carinho</strong> que vocês têm por mim. Logo, logo vou chegar para encher a vida de todo mundo de alegria!\n\nPreparamos esse site com muito amor para o <strong>meu Chá</strong> e para guardar os <strong>recadinhos especiais</strong> de vocês.\n\nPor aqui, vocês podem <strong>confirmar presença</strong>, dar o seu <strong>palpite sobre quem eu sou</strong> e escolher um presente na nossa <strong>Lista de Presentes</strong>. Mas fiquem à vontade: quem preferir também pode <strong>levar pessoalmente</strong> no dia.\n\nFizemos tudo com muito carinho para que vocês participem desse momento de um jeito <strong>prático e cheio de amor</strong>."
          }
        });
      } catch (dbErr) {
        console.error("Erro ao migrar mensagem no banco:", dbErr);
      }
    }

    let [eventSetting, musicSetting, paymentSetting, videoSetting] = await Promise.all([
      prisma.eventSetting.findFirst(),
      prisma.musicSetting.findFirst(),
      prisma.paymentSetting.findFirst(),
      prisma.video.findFirst(),
    ]);

    // Migração automática em tempo de execução para atualizar a URL da música no banco de dados Neon
    if (musicSetting && (musicSetting.audioUrl !== "/a_bencao.mp3" || !musicSetting.isActive)) {
      try {
        musicSetting = await prisma.musicSetting.update({
          where: { id: musicSetting.id },
          data: {
            audioUrl: "/a_bencao.mp3",
            isActive: true
          }
        });
      } catch (dbErr) {
        console.error("Erro ao migrar URL da música no banco:", dbErr);
      }
    }

    // Migração automática em tempo de execução para atualizar a localização no banco de dados Neon
    if (eventSetting && eventSetting.googleMapsUrl !== "https://maps.app.goo.gl/W1VWq4w2wUpApKER7") {
      try {
        eventSetting = await prisma.eventSetting.update({
          where: { id: eventSetting.id },
          data: {
            googleMapsUrl: "https://maps.app.goo.gl/W1VWq4w2wUpApKER7"
          }
        });
      } catch (dbErr) {
        console.error("Erro ao migrar link de localização no banco:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      site: siteSetting || {
        siteTitle: "Chá Revelação",
        siteDescription: "Venha participar do nosso Chá Revelação!",
        siteKeywords: "chá revelação, bebê, miguel, rafaella",
        messageTitle: "Oi, queridos amigos e familiares!",
        messageText: "Eu ainda estou bem quentinho aqui na <strong>barriga da mamãe</strong>, mas já sinto todo o <strong>amor</strong> e <strong>carinho</strong> que vocês têm por mim. Logo, logo vou chegar para encher a vida de todo mundo de alegria!\n\nPreparamos esse site com muito amor para o <strong>meu Chá</strong> e para guardar os <strong>recadinhos especiais</strong> de vocês.\n\nPor aqui, vocês podem <strong>confirmar presença</strong>, dar o seu <strong>palpite sobre quem eu sou</strong> e escolher um presente na nossa <strong>Lista de Presentes</strong>. Mas fiquem à vontade: quem preferir também pode <strong>levar pessoalmente</strong> no dia.\n\nFizemos tudo com muito carinho para que vocês participem desse momento de um jeito <strong>prático e cheio de amor</strong>.",
        themeJson: "{}",
      },
      event: eventSetting || {
        title: "Chá Revelação",
        babyOption1: "Miguel",
        babyOption2: "Rafaella",
        eventDate: new Date("2026-07-18T17:00:00.000Z"),
        eventTime: "14:00",
        locationName: "Espaço Kolina",
        address: "Rua Nabôr do Rêgo, 384 – Ramos",
        googleMapsUrl: "https://maps.app.goo.gl/W1VWq4w2wUpApKER7",
        deliveryAddress: "",
        deliveryInstructions: "",
        contactPhone: "",
        showCountdown: true,
      },
      music: musicSetting || {
        audioUrl: "/a_bencao.mp3",
        isActive: true,
        initialVolume: 0.5,
        autoRestart: true,
      },
      payment: paymentSetting ? {
        gateway: paymentSetting.gateway,
        maxInstallments: paymentSetting.maxInstallments,
        feePolicy: paymentSetting.feePolicy,
        isTestEnvironment: paymentSetting.isTestEnvironment,
        checkoutMessage: paymentSetting.checkoutMessage,
        // Ocultamos chaves de API secretas por privacidade e segurança no frontend
        pixKey: paymentSetting.pixKey, 
        pixReceiverName: paymentSetting.pixReceiverName,
      } : {
        gateway: "mercadopago",
        maxInstallments: 5,
        feePolicy: "absorb",
        isTestEnvironment: true,
      },
      video: videoSetting || {
        title: "Um Recadinho Especial",
        description: "Assista ao vídeo que preparamos para compartilhar esse amor!",
        videoUrl: "",
        isActive: false,
        isUpload: false,
      }
    });
  } catch (error) {
    console.error("Erro ao obter configurações:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do evento." }, { status: 500 });
  }
}
