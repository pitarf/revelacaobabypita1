import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// POST: Adiciona uma nova imagem na galeria
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { imageUrl, caption, isFeatured } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "A URL da imagem é obrigatória." }, { status: 400 });
    }

    const newPhoto = await prisma.galleryImage.create({
      data: {
        imageUrl,
        caption: caption || null,
        isFeatured: isFeatured !== undefined ? isFeatured : false,
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "ADD_GALLERY_PHOTO",
        details: `Adicionou imagem à galeria: ${imageUrl}`,
      },
    });

    return NextResponse.json({ success: true, data: newPhoto });
  } catch (error) {
    console.error("Erro no POST admin/gallery:", error);
    return NextResponse.json({ error: "Erro ao adicionar foto." }, { status: 500 });
  }
}

// DELETE: Remove uma imagem da galeria pelo ID
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da imagem não fornecido." }, { status: 400 });
    }

    const deleted = await prisma.galleryImage.delete({
      where: { id },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        adminId: session.id,
        action: "DELETE_GALLERY_PHOTO",
        details: `Removeu foto ID ${id} da galeria.`,
      },
    });

    return NextResponse.json({ success: true, message: "Foto removida com sucesso!" });
  } catch (error) {
    console.error("Erro no DELETE admin/gallery:", error);
    return NextResponse.json({ error: "Erro ao excluir foto da galeria." }, { status: 500 });
  }
}
