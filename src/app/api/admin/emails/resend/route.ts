import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const { emailLogId } = await req.json();
    if (!emailLogId) {
      return NextResponse.json({ error: "ID do e-mail é obrigatório." }, { status: 400 });
    }

    const emailLog = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog) {
      return NextResponse.json({ error: "E-mail não encontrado." }, { status: 404 });
    }

    // Chama o envio usando o mesmo ID para atualizar o log existente
    // sendEmail não é await aqui porque queremos retornar logo para o painel
    // Mas para o admin ter feedback, podemos dar await
    await sendEmail(emailLog.to, emailLog.subject, emailLog.htmlContent, emailLog.id);

    // O status no banco será atualizado pelo sendEmail
    return NextResponse.json({ success: true, message: "E-mail reenviado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao reenviar e-mail:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error?.message }, { status: 500 });
  }
}
