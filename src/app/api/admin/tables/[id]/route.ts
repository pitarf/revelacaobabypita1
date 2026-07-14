import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Podemos atualizar os dados da mesa (name, capacity) e os convidados
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);

    const table = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(table);
  } catch (error: any) {
    console.error("Erro ao atualizar mesa:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar mesa." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Primeiro desassocia os convidados
    await prisma.guest.updateMany({
      where: { tableId: id },
      data: { tableId: null },
    });

    // Depois deleta a mesa
    await prisma.table.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir mesa:", error);
    return NextResponse.json(
      { error: "Falha ao excluir mesa." },
      { status: 500 }
    );
  }
}
