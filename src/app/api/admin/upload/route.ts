import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Imagem não fornecida." }, { status: 400 });
    }

    // A string base64 deve vir como: "data:image/webp;base64,UklGRiQAAABXRUJQ..."
    const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: "Formato de imagem inválido." }, { status: 400 });
    }

    const buffer = Buffer.from(matches[2], "base64");
    
    // Garantir nome único
    const fileName = `gift_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    
    // Caminho da pasta public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${fileName}` 
    });
  } catch (error) {
    console.error("Erro no POST admin/upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload da imagem." }, { status: 500 });
  }
}
