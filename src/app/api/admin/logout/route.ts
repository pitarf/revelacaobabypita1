import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json(
      { error: "Erro ao encerrar a sessão. Tente novamente." },
      { status: 500 }
    );
  }
}
