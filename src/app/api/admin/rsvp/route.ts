import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todos os RSVPs
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const rsvps = await prisma.rsvp.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: rsvps });
  } catch (error) {
    console.error("Erro no GET admin/rsvp:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST: Cria RSVP manualmente pelo admin
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const {
      fullName,
      email,
      phone,
      adultsCount,
      childrenCount,
      companionsNames,
      foodRestriction,
      notes,
      status,
    } = await req.json();

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: "Nome, E-mail e Celular são obrigatórios." }, { status: 400 });
    }

    // Gera um accessCode único de 6 caracteres
    let accessCode = "";
    let codeExists = true;
    while (codeExists) {
      accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const check = await prisma.rsvp.findUnique({ where: { accessCode } });
      if (!check) codeExists = false;
    }

    const newRsvp = await prisma.rsvp.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone,
        adultsCount: parseInt(adultsCount || "1"),
        childrenCount: parseInt(childrenCount || "0"),
        totalGuests: parseInt(adultsCount || "1") + parseInt(childrenCount || "0"),
        companionsNames: companionsNames || null,
        foodRestriction: foodRestriction || null,
        notes: notes || null,
        accessCode,
        status: status || "confirmed",
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "CREATE_RSVP_MANUAL",
        details: `Criou RSVP manual para ${fullName} (Código: ${accessCode})`,
      },
    });

    return NextResponse.json({ success: true, data: newRsvp });
  } catch (error) {
    console.error("Erro no POST admin/rsvp:", error);
    return NextResponse.json({ error: "Erro ao criar RSVP manual." }, { status: 500 });
  }
}

// PUT: Atualiza RSVP
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const {
      id,
      fullName,
      email,
      phone,
      adultsCount,
      childrenCount,
      companionsNames,
      foodRestriction,
      notes,
      status,
    } = await req.json();

    if (!id || !fullName || !email || !phone) {
      return NextResponse.json({ error: "Dados incompletos para edição." }, { status: 400 });
    }

    const targetAdults = parseInt(adultsCount || "1");
    const targetChildren = parseInt(childrenCount || "0");

    const updated = await prisma.rsvp.update({
      where: { id },
      data: {
        fullName,
        email: email.toLowerCase(),
        phone,
        adultsCount: targetAdults,
        childrenCount: targetChildren,
        totalGuests: targetAdults + targetChildren,
        companionsNames: companionsNames || null,
        foodRestriction: foodRestriction || null,
        notes: notes || null,
        status,
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "UPDATE_RSVP",
        details: `Atualizou RSVP ID ${id} (${fullName})`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erro no PUT admin/rsvp:", error);
    return NextResponse.json({ error: "Erro ao atualizar RSVP." }, { status: 500 });
  }
}

// DELETE: Exclui RSVP
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
    }

    const deleted = await prisma.rsvp.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_RSVP",
        details: `Excluiu RSVP de ${deleted.fullName} (ID: ${id})`,
      },
    });

    return NextResponse.json({ success: true, message: "Confirmação excluída com sucesso." });
  } catch (error) {
    console.error("Erro no DELETE admin/rsvp:", error);
    return NextResponse.json({ error: "Erro ao excluir RSVP." }, { status: 500 });
  }
}
