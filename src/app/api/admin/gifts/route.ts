import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todos os presentes
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const gifts = await prisma.gift.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });

    // Formata decimais e calcula o estoque restante
    const formatted = gifts.map((g) => ({
      ...g,
      value: parseFloat(g.value.toString()),
      remainingQuantity: Math.max(0, g.maxQuantity - g.chosenQuantity),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erro no GET admin/gifts:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST: Cria novo presente
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const {
      name,
      description,
      imageUrl,
      value,
      maxQuantity,
      externalLink,
      isFeatured,
      status,
      categoryId,
      allowedPaymentMethods,
    } = await req.json();

    if (!name || !value || !categoryId) {
      return NextResponse.json({ error: "Nome, Valor e Categoria são obrigatórios." }, { status: 400 });
    }

    const newGift = await prisma.gift.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        value: parseFloat(value),
        maxQuantity: parseInt(maxQuantity || "1"),
        externalLink: externalLink || null,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
        status: status === "inactive" ? "inactive" : "available",
        categoryId,
        allowedPaymentMethods: allowedPaymentMethods || "pix,card,personal,link",
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "CREATE_GIFT",
        details: `Criou presente ${name} no valor de R$ ${value}`,
      },
    });

    return NextResponse.json({ success: true, data: newGift });
  } catch (error) {
    console.error("Erro no POST admin/gifts:", error);
    return NextResponse.json({ error: "Erro ao criar presente." }, { status: 500 });
  }
}

// PUT: Atualiza presente
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const {
      id,
      name,
      description,
      imageUrl,
      value,
      maxQuantity,
      externalLink,
      isFeatured,
      status,
      categoryId,
      allowedPaymentMethods,
    } = await req.json();

    if (!id || !name || !value || !categoryId) {
      return NextResponse.json({ error: "Dados incompletos para edição." }, { status: 400 });
    }

    // Carrega o presente atual para saber o estoque anterior e compras realizadas
    const currentGift = await prisma.gift.findUnique({
      where: { id },
    });

    if (!currentGift) {
      return NextResponse.json({ error: "Presente não localizado." }, { status: 404 });
    }

    const targetMax = parseInt(maxQuantity);
    
    // Auto-calcula o status de estoque
    let finalStatus = status === "inactive" ? "inactive" : "available";
    if (finalStatus === "available" && currentGift.chosenQuantity >= targetMax) {
      finalStatus = "out_of_stock";
    }

    const updated = await prisma.gift.update({
      where: { id },
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        value: parseFloat(value),
        maxQuantity: targetMax,
        externalLink: externalLink || null,
        isFeatured,
        status: finalStatus,
        categoryId,
        allowedPaymentMethods: allowedPaymentMethods || "pix,card,personal,link",
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "UPDATE_GIFT",
        details: `Atualizou presente ID ${id} (Nome: ${name})`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erro no PUT admin/gifts:", error);
    return NextResponse.json({ error: "Erro ao atualizar presente." }, { status: 500 });
  }
}

// DELETE: Exclui presente
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

    // Verifica integridade: possui compras/itens de pedidos associados?
    const associatedOrders = await prisma.orderItem.count({
      where: { giftId: id },
    });

    if (associatedOrders > 0) {
      return NextResponse.json({
        error: `Este presente já possui ${associatedOrders} pedido(s) associado(s). Para não corromper o histórico financeiro dos pais, altere o status do presente para 'Inativo' em vez de excluí-lo permanentemente.`,
      }, { status: 400 });
    }

    const deleted = await prisma.gift.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_GIFT",
        details: `Excluiu presente ${deleted.name} (ID: ${id})`,
      },
    });

    return NextResponse.json({ success: true, message: "Presente excluído com sucesso." });
  } catch (error) {
    console.error("Erro no DELETE admin/gifts:", error);
    return NextResponse.json({ error: "Erro ao excluir presente." }, { status: 500 });
  }
}
