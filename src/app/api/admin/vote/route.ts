import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todos os palpites detalhadamente
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const votes = await prisma.vote.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: votes });
  } catch (error) {
    console.error("Erro no GET admin/vote:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// DELETE: Exclui um palpite (ex: voto duplicado, spam ou bots)
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

    const deleted = await prisma.vote.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_VOTE",
        details: `Excluiu palpite de ${deleted.voterEmail || deleted.voterPhone || "Anônimo"} no bebê ${deleted.babyName}`,
      },
    });

    return NextResponse.json({ success: true, message: "Palpite excluído com sucesso." });
  } catch (error) {
    console.error("Erro no DELETE admin/vote:", error);
    return NextResponse.json({ error: "Erro ao excluir palpite." }, { status: 500 });
  }
}
