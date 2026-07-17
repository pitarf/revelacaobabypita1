import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: SendMailParams) {
  try {
    const from = process.env.SMTP_FROM || '"Chá Revelação" <contato@seusite.com.br>';
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email para', to, error);
    return { success: false, error };
  }
}

export async function broadcastConfirmedGuests() {
  // Pega os guests que tem RSVP atrelado (portanto, tem e-mail)
  const rsvps = await prisma.rsvp.findMany({
    where: {
      status: 'confirmed',
    }
  });

  const results = {
    sent: 0,
    skippedNoEmail: 0,
    failed: 0,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const rsvp of rsvps) {
    if (!rsvp.email) {
      results.skippedNoEmail++;
      continue;
    }

    // Checa se deixou recado pelo NOME do RSVP
    const guestMessage = await prisma.guestMessage.findFirst({
      where: {
        name: {
          contains: rsvp.fullName.split(' ')[0], // Tenta achar pelo primeiro nome
          mode: 'insensitive'
        }
      }
    });

    // Checa se comprou presente pelo EMAIL
    const order = await prisma.order.findFirst({
      where: {
        gifterEmail: rsvp.email,
        paymentStatus: {
          in: ['approved', 'pending']
        }
      }
    });

    let htmlContent = `
      <div style="font-family: sans-serif; color: #4a4a4a; max-width: 600px; margin: 0 auto;">
        <h2>Que alegria! Falta pouco para o nosso encontro! 🍼🎉</h2>
        <p>Olá <strong>${rsvp.fullName}</strong>, tudo bem?</p>
        <p>Ficamos imensamente felizes em ver que você confirmou a sua presença no Chá de Bebê! A sua companhia é muito especial para nós e mal podemos esperar para celebrarmos juntos esse momento tão mágico.</p>
        <hr style="border: 1px solid #eee; my-4" />
    `;

    if (!guestMessage) {
      htmlContent += `
        <p><strong>Aproveitando, vimos que você ainda não deixou uma mensagem no nosso mural de recados.</strong></p>
        <p>Se quiser deixar algumas palavras de carinho para guardarmos de lembrança desse dia especial, é só acessar o nosso site! Adoraríamos ler sua mensagem. 🥰</p>
        <p><a href="${appUrl}/#recados" style="display: inline-block; padding: 10px 20px; background-color: #5c5bd5; color: white; text-decoration: none; border-radius: 5px;">Deixar Recadinho</a></p>
        <hr style="border: 1px solid #eee; my-4" />
      `;
    }

    if (!order) {
      htmlContent += `
        <p><strong>Caso você ainda esteja em dúvida sobre o que nos dar de presente,</strong> preparamos uma listinha super prática e segura no nosso site.</p>
        <p>Tem opções para todos os bolsos e você nem precisa se preocupar em levar nada no dia da festa! É só acessar a Lista de Presentes no nosso site. 🎁</p>
        <p><a href="${appUrl}/presentes" style="display: inline-block; padding: 10px 20px; background-color: #e0589a; color: white; text-decoration: none; border-radius: 5px;">Ver Lista de Presentes</a></p>
        <hr style="border: 1px solid #eee; my-4" />
      `;
    }

    htmlContent += `
        <p>Muito obrigado(a) por fazer parte dessa história!</p>
        <p>Com carinho,<br/><strong>Família Babypita</strong></p>
      </div>
    `;

    // Enviar o e-mail
    const emailResult = await sendEmail({
      to: rsvp.email,
      subject: 'Falta pouco para o nosso encontro! 🍼🎉',
      html: htmlContent
    });

    if (emailResult.success) {
      results.sent++;
      
      // Salva no log de emails
      await prisma.emailLog.create({
        data: {
          to: rsvp.email,
          subject: 'Falta pouco para o nosso encontro! 🍼🎉',
          htmlContent,
          status: 'sent',
          sentAt: new Date(),
        }
      });
    } else {
      results.failed++;
      await prisma.emailLog.create({
        data: {
          to: rsvp.email,
          subject: 'Falta pouco para o nosso encontro! 🍼🎉',
          htmlContent,
          status: 'failed',
          errorMessage: emailResult.error ? JSON.stringify(emailResult.error) : 'Erro desconhecido'
        }
      });
    }
  }

  return results;
}
