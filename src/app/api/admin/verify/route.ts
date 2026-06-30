import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Realize o login novamente." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    console.error("Erro na verificação de sessão:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
