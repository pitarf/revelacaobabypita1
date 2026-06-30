import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
    });

    if (images.length === 0) {
      // Fotos do ensaio local contendo 'capa' no nome
      const mockImages = [
        {
          id: "capa-1",
          imageUrl: "/capav1.jpg",
          caption: "Nossa doce espera começou!",
          isFeatured: true,
          order: 1,
        },
        {
          id: "capa-2",
          imageUrl: "/capa 2v1.jpg",
          caption: "Amor que não cabe no peito.",
          isFeatured: false,
          order: 2,
        },
        {
          id: "capa-3",
          imageUrl: "/capa 3v1.jpg",
          caption: "Cada detalhe planejado com muito carinho.",
          isFeatured: false,
          order: 3,
        },
        {
          id: "capa-4",
          imageUrl: "/capa 4v1.jpg",
          caption: "À espera do nosso maior presente.",
          isFeatured: false,
          order: 4,
        },
        {
          id: "capa-5",
          imageUrl: "/capa 5v1.jpg",
          caption: "Família crescendo e transbordando alegria.",
          isFeatured: false,
          order: 5,
        },
      ];
      return NextResponse.json({ success: true, data: mockImages });
    }

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("Erro ao obter galeria:", error);
    return NextResponse.json({ error: "Erro ao obter fotos da galeria." }, { status: 500 });
  }
}
