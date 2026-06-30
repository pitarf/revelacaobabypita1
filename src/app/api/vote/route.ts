import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vote - Retorna os resultados acumulados da votação
export async function GET() {
  try {
    // 1. Carrega as configurações de evento e site
    const eventSetting = await prisma.eventSetting.findFirst();
    const siteSetting = await prisma.siteSetting.findFirst();

    if (!eventSetting) {
      return NextResponse.json({ error: "Configurações de evento não encontradas." }, { status: 404 });
    }

    const babyOption1 = eventSetting.babyOption1 || "Miguel";
    const babyOption2 = eventSetting.babyOption2 || "Rafaella";

    // 2. Conta os votos de cada opção
    const countOption1 = await prisma.vote.count({
      where: { babyName: babyOption1 },
    });

    const countOption2 = await prisma.vote.count({
      where: { babyName: babyOption2 },
    });

    const totalVotes = countOption1 + countOption2;

    // Calcula as porcentagens
    const percentageOption1 = totalVotes > 0 ? Math.round((countOption1 / totalVotes) * 100) : 50;
    const percentageOption2 = totalVotes > 0 ? Math.round((countOption2 / totalVotes) * 100) : 50;

    // Verifica se há configuração para ocultar resultados
    // Lemos as configurações visuais do themeJson
    let hideResults = false;
    if (siteSetting?.themeJson) {
      try {
        const theme = JSON.parse(siteSetting.themeJson);
        hideResults = !!theme.hideVotingResults;
      } catch (e) {
        hideResults = false;
      }
    }

    return NextResponse.json({
      option1: {
        name: babyOption1,
        count: countOption1,
        percentage: percentageOption1,
      },
      option2: {
        name: babyOption2,
        count: countOption2,
        percentage: percentageOption2,
      },
      total: totalVotes,
      hideResults,
    });
  } catch (error) {
    console.error("Erro ao obter votos:", error);
    return NextResponse.json({ error: "Erro ao processar votação." }, { status: 500 });
  }
}

// POST /api/vote - Registra um novo palpite/voto
export async function POST(req: NextRequest) {
  try {
    const { babyName, voterPhone, voterEmail } = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

    // 1. Validações básicas de entrada
    if (!babyName) {
      return NextResponse.json({ error: "Escolha uma das opções para votar." }, { status: 400 });
    }

    const eventSetting = await prisma.eventSetting.findFirst();
    const siteSetting = await prisma.siteSetting.findFirst();

    if (!eventSetting) {
      return NextResponse.json({ error: "Configurações do evento não inicializadas." }, { status: 500 });
    }

    const babyOption1 = eventSetting.babyOption1 || "Miguel";
    const babyOption2 = eventSetting.babyOption2 || "Rafaella";

    if (babyName !== babyOption1 && babyName !== babyOption2) {
      return NextResponse.json({ error: "Opção de bebê inválida." }, { status: 400 });
    }

    // Verifica se a votação está bloqueada via configurações
    let isVotingBlocked = false;
    if (siteSetting?.themeJson) {
      try {
        const theme = JSON.parse(siteSetting.themeJson);
        isVotingBlocked = !!theme.isVotingBlocked;
      } catch (e) {
        isVotingBlocked = false;
      }
    }

    if (isVotingBlocked) {
      return NextResponse.json({ error: "A votação já foi encerrada pelos pais." }, { status: 400 });
    }

    // 2. Prevenção de Spam / Duplicidade de Voto

    // A. Verifica se o cookie de voto já existe
    const hasVotedCookie = req.cookies.get("has_voted")?.value;
    if (hasVotedCookie) {
      return NextResponse.json({ error: "Você já registrou seu palpite!" }, { status: 400 });
    }

    // B. Verifica se o e-mail ou telefone já votou (se fornecidos)
    if (voterEmail) {
      const emailExists = await prisma.vote.findFirst({
        where: { voterEmail: voterEmail.trim().toLowerCase() },
      });
      if (emailExists) {
        return NextResponse.json({ error: "Este e-mail já foi utilizado para votar." }, { status: 400 });
      }
    }

    if (voterPhone) {
      // Limpa caracteres especiais do telefone para comparar puramente
      const cleanPhone = voterPhone.replace(/\D/g, "");
      if (cleanPhone) {
        const phoneExists = await prisma.vote.findFirst({
          where: {
            voterPhone: {
              contains: cleanPhone,
            },
          },
        });
        if (phoneExists) {
          return NextResponse.json({ error: "Este número de telefone já foi utilizado para votar." }, { status: 400 });
        }
      }
    }

    // C. Limite de segurança por IP nas últimas 24 horas (máximo 5 votos)
    // Isso evita scripts de flood, mas permite que uma família (mesma rede/casa) vote junta.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const ipVotesCount = await prisma.vote.count({
      where: {
        voterIp: ipAddress,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (ipVotesCount >= 5) {
      return NextResponse.json({
        error: "Limite de votos excedido para esta rede de internet. Tente novamente mais tarde.",
      }, { status: 429 });
    }

    // 3. Registra o voto
    await prisma.vote.create({
      data: {
        babyName,
        voterIp: ipAddress,
        voterEmail: voterEmail ? voterEmail.trim().toLowerCase() : null,
        voterPhone: voterPhone ? voterPhone.replace(/\D/g, "") : null,
      },
    });

    // 4. Recalcula os resultados em tempo real para retornar
    const countOption1 = await prisma.vote.count({ where: { babyName: babyOption1 } });
    const countOption2 = await prisma.vote.count({ where: { babyName: babyOption2 } });
    const totalVotes = countOption1 + countOption2;

    const percentageOption1 = totalVotes > 0 ? Math.round((countOption1 / totalVotes) * 100) : 50;
    const percentageOption2 = totalVotes > 0 ? Math.round((countOption2 / totalVotes) * 100) : 50;

    let hideResults = false;
    if (siteSetting?.themeJson) {
      try {
        const theme = JSON.parse(siteSetting.themeJson);
        hideResults = !!theme.hideVotingResults;
      } catch (e) {}
    }

    const response = NextResponse.json({
      success: true,
      message: "Palpite registrado com sucesso! Obrigado por participar.",
      option1: {
        name: babyOption1,
        count: countOption1,
        percentage: percentageOption1,
      },
      option2: {
        name: babyOption2,
        count: countOption2,
        percentage: percentageOption2,
      },
      total: totalVotes,
      hideResults,
    });

    // Seta o cookie "has_voted=1" para expirar em 30 dias
    response.cookies.set("has_voted", "1", {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Erro ao registrar voto:", error);
    return NextResponse.json({ error: "Servidor instável. Tente novamente em alguns instantes." }, { status: 500 });
  }
}
