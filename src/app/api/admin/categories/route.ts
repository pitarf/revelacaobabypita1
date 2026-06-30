import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET: Lista todas as categorias
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Erro no GET admin/categories:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST: Cria nova categoria
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { name, slug, order, isActive } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios." }, { status: 400 });
    }

    // Verifica slug único
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: "Este slug já está cadastrado em outra categoria." }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        order: order ? parseInt(order) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Cria auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "CREATE_CATEGORY",
        details: `Criou categoria ${name} (slug: ${slug})`,
      },
    });

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error) {
    console.error("Erro no POST admin/categories:", error);
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 });
  }
}

// PUT: Atualiza categoria
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id, name, slug, order, isActive } = await req.json();

    if (!id || !name || !slug) {
      return NextResponse.json({ error: "Dados incompletos para edição." }, { status: 400 });
    }

    // Verifica duplicidade de slug
    const exists = await prisma.category.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });
    if (exists) {
      return NextResponse.json({ error: "Este slug já está em uso por outra categoria." }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        order: order ? parseInt(order) : 0,
        isActive,
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "UPDATE_CATEGORY",
        details: `Atualizou categoria ID ${id} para ${name}`,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erro no PUT admin/categories:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria." }, { status: 500 });
  }
}

// DELETE: Exclui categoria
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

    // Verifica integridade referencial: tem presentes associados?
    const associatedGifts = await prisma.gift.count({
      where: { categoryId: id },
    });

    if (associatedGifts > 0) {
      return NextResponse.json({
        error: `Existem ${associatedGifts} presente(s) cadastrado(s) nesta categoria. Reassocie ou exclua os presentes antes de excluir a categoria para garantir a integridade do banco.`,
      }, { status: 400 });
    }

    const deleted = await prisma.category.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_CATEGORY",
        details: `Excluiu categoria ${deleted.name} (ID: ${id})`,
      },
    });

    return NextResponse.json({ success: true, message: "Categoria excluída com sucesso." });
  } catch (error) {
    console.error("Erro no DELETE admin/categories:", error);
    return NextResponse.json({ error: "Erro ao excluir categoria." }, { status: 500 });
  }
}
