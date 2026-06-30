import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/admin/messages - Lista todos os recados para moderação
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const messages = await prisma.guestMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Erro no GET admin/messages:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// DELETE /api/admin/messages - Exclui um recado do mural
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
    }

    const deleted = await prisma.guestMessage.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_GUEST_MESSAGE",
        details: `Excluiu recado de ${deleted.name}: "${deleted.message.substring(0, 50)}..."`,
      },
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error("Erro no DELETE admin/messages:", error);
    return NextResponse.json({ error: "Erro ao excluir recado." }, { status: 500 });
  }
}
