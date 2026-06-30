import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Por favor, digite a senha." },
        { status: 400 }
      );
    }

    if (password !== "babyPita2026") {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 }
      );
    }

    // Busca o primeiro administrador no banco para gerar o token e auditar
    const admin = await prisma.administrator.findFirst();

    if (!admin) {
      return NextResponse.json(
        { error: "Nenhum administrador configurado no sistema." },
        { status: 500 }
      );
    }

    // Gera o payload e token JWT
    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    const token = signToken(payload);

    // Seta o cookie http-only
    await setAdminSession(token);

    // Registra a ação no log de auditoria
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "LOGIN",
        details: "Administrador logado no painel com sucesso.",
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Servidor instável. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
