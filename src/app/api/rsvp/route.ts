import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRsvpConfirmation } from "@/lib/email";
// GET /api/rsvp?code=XXXXXX - Consulta detalhes de uma confirmação pelo código de acesso
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Código de acesso não fornecido." }, { status: 400 });
    }

    const rsvp = await prisma.rsvp.findUnique({
      where: { accessCode: code },
    });

    if (!rsvp) {
      return NextResponse.json({ error: "Confirmação de presença não encontrada com este código." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rsvp });
  } catch (error) {
    console.error("Erro ao buscar RSVP:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST /api/rsvp - Cadastra ou edita uma confirmação de presença
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      adultsCount,
      childrenCount,
      companionsNames,
      foodRestriction,
      notes,
      accessCode, // Se enviado, indica uma EDICAO
      isAttending = true,
    } = body;

    // 1. Validações básicas de formato
    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Por favor, preencha nome, e-mail e telefone." }, { status: 400 });
    }

    // 2. Verifica prazo limite de RSVP nas configurações do evento
    const eventSetting = await prisma.eventSetting.findFirst();
    if (eventSetting?.rsvpDeadline) {
      const now = new Date();
      const deadline = new Date(eventSetting.rsvpDeadline);
      if (now > deadline) {
        return NextResponse.json({ error: "O prazo limite para confirmação de presença já se encerrou." }, { status: 400 });
      }
    }

    const parsedAdults = Math.max(1, parseInt(adultsCount) || 1);
    const parsedChildren = Math.max(0, parseInt(childrenCount) || 0);
    const totalGuests = parsedAdults + parsedChildren;
    const cleanPhone = phone.replace(/\D/g, "");

    // Preparar dados do evento para o e-mail
    let eventTitle = "nosso Chá Revelação (Miguel ou Rafaella?)";
    let eventDateStr = "";
    let locationStr = "";
    let googleMapsUrl = null;
    
    if (eventSetting) {
      eventTitle = eventSetting.title || eventTitle;
      googleMapsUrl = eventSetting.googleMapsUrl || null;
      if (eventSetting.eventDate) {
        const eDate = new Date(eventSetting.eventDate);
        const dStr = eDate.toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' });
        eventDateStr = `${dStr} às ${eventSetting.eventTime || ""}`;
      }
      if (eventSetting.locationName || eventSetting.address) {
        locationStr = `${eventSetting.locationName || ""} ${eventSetting.address ? "- " + eventSetting.address : ""}`.trim();
        if (locationStr.startsWith("- ")) locationStr = locationStr.substring(2);
      }
    }

    // 3. Processamento de EDICAO de RSVP existente
    if (accessCode) {
      const cleanCode = accessCode.toUpperCase().trim();
      const existingRsvp = await prisma.rsvp.findUnique({
        where: { accessCode: cleanCode },
      });

      if (!existingRsvp) {
        return NextResponse.json({ error: "Código de acesso inválido para edição." }, { status: 404 });
      }

      // Se o RSVP existente estava cancelado, reativa-o como confirmado
      const updatedRsvp = await prisma.rsvp.update({
        where: { id: existingRsvp.id },
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          adultsCount: parsedAdults,
          childrenCount: parsedChildren,
          totalGuests,
          companionsNames: companionsNames ? companionsNames.trim() : null,
          foodRestriction: foodRestriction ? foodRestriction.trim() : null,
          notes: notes ? notes.trim() : null,
          status: isAttending ? "confirmed" : "cancelled",
        },
      });

      sendRsvpConfirmation(updatedRsvp.email, updatedRsvp.fullName, eventTitle, eventDateStr, locationStr, googleMapsUrl).catch(console.error);

      return NextResponse.json({
        success: true,
        message: isAttending ? "Sua confirmação de presença foi atualizada com sucesso!" : "Que pena que não poderá ir! Seu status foi atualizado.",
        data: updatedRsvp,
      });
    }

    // 4. Processamento de NOVO RSVP
    // Garante que o e-mail ou telefone do convidado não está duplicado para o mesmo evento (opcional, mas evita envios duplicados acidentais)
    const duplicateCheck = await prisma.rsvp.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase(), status: "confirmed" },
          { phone: cleanPhone, status: "confirmed" },
        ],
      },
    });

    if (duplicateCheck) {
      return NextResponse.json({
        error: "Já existe uma confirmação ativa com este e-mail ou telefone. Utilize o código enviado para alterar seus dados.",
      }, { status: 400 });
    }

    // Gera código usando Primeiro Nome + número
    const firstName = fullName.trim().split(" ")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
    let code = "";
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 20) {
      const numDigits = attempts < 10 ? 1 : 2;
      const maxVal = attempts < 10 ? 5 : 50;
      const num = Math.floor(Math.random() * maxVal) * 2;
      code = `${firstName}${num}`;
      
      const exists = await prisma.rsvp.findUnique({ where: { accessCode: code } });
      if (!exists) {
        isUnique = true;
      }
      attempts++;
    }

    const newRsvp = await prisma.rsvp.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        adultsCount: parsedAdults,
        childrenCount: parsedChildren,
        totalGuests,
        companionsNames: companionsNames ? companionsNames.trim() : null,
        foodRestriction: foodRestriction ? foodRestriction.trim() : null,
        notes: notes ? notes.trim() : null,
        status: isAttending ? "confirmed" : "cancelled",
        accessCode: code,
      },
    });

    sendRsvpConfirmation(newRsvp.email, newRsvp.fullName, eventTitle, eventDateStr, locationStr, googleMapsUrl).catch(console.error);

    return NextResponse.json({
      success: true,
      message: isAttending ? "Presença confirmada com sucesso! Ficamos muito felizes em ter você conosco." : "Que pena que não poderá ir! Agradecemos por nos avisar.",
      data: newRsvp,
    });
  } catch (error) {
    console.error("Erro ao registrar RSVP:", error);
    return NextResponse.json({ error: "Servidor instável. Tente novamente em alguns instantes." }, { status: 500 });
  }
}

// DELETE /api/rsvp?code=XXXXXX - Cancela uma confirmação de presença (muda status para cancelled)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Código de acesso não fornecido." }, { status: 400 });
    }

    const rsvp = await prisma.rsvp.findUnique({
      where: { accessCode: code },
    });

    if (!rsvp) {
      return NextResponse.json({ error: "Confirmação de presença não encontrada." }, { status: 404 });
    }

    // Altera o status para 'cancelled' em vez de deletar fisicamente, preservando dados históricos
    const updatedRsvp = await prisma.rsvp.update({
      where: { id: rsvp.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({
      success: true,
      message: "Presença cancelada com sucesso. Caso mude de ideia, você pode confirmar novamente a qualquer momento.",
      data: updatedRsvp,
    });
  } catch (error) {
    console.error("Erro ao cancelar RSVP:", error);
    return NextResponse.json({ error: "Erro ao cancelar a confirmação de presença." }, { status: 500 });
  }
}
