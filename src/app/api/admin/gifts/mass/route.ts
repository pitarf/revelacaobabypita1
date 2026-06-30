import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { ids, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs não fornecidos." }, { status: 400 });
    }

    if (action !== 'active' && action !== 'inactive') {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
    
    await prisma.gift.updateMany({
      where: { id: { in: ids } },
      data: { status: action === 'active' ? 'available' : 'inactive' },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "MASS_UPDATE_GIFTS",
        details: `Atualizou ${ids.length} presentes para ${action}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no PATCH admin/gifts/mass:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs não fornecidos." }, { status: 400 });
    }

    // Verifica se algum presente possui pedidos associados
    const associatedOrders = await prisma.orderItem.count({
      where: { giftId: { in: ids } },
    });

    if (associatedOrders > 0) {
      return NextResponse.json({
        error: `Existem ${associatedOrders} pedido(s) associado(s) a alguns desses presentes. Eles não podem ser excluídos, apenas inativados.`,
      }, { status: 400 });
    }

    await prisma.gift.deleteMany({
      where: { id: { in: ids } },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "MASS_DELETE_GIFTS",
        details: `Excluiu permanentemente ${ids.length} presentes`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro no DELETE admin/gifts/mass:", error);
    return NextResponse.json({ error: "Erro ao excluir presentes." }, { status: 500 });
  }
}
