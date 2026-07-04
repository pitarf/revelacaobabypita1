import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, group, rsvpId, isManuallyConfirmed } = body;

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        group: group !== undefined ? group : undefined,
        rsvpId: rsvpId !== undefined ? (rsvpId === null ? null : rsvpId) : undefined,
        isManuallyConfirmed: isManuallyConfirmed !== undefined ? Boolean(isManuallyConfirmed) : undefined,
      },
      include: {
        rsvp: true
      }
    });

    return NextResponse.json(updatedGuest);
  } catch (error) {
    console.error("Erro ao atualizar convidado:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.guest.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir convidado:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
