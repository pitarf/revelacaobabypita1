import { prisma } from "./prisma";

export const sendEmail = async (to: string, subject: string, html: string, existingLogId?: string) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY não configurada. E-mail não será enviado.");
    return;
  }
  
  let emailLogId: string | null = existingLogId || null;
  
  try {
    if (!existingLogId) {
      // 1. Cria o log como 'pending'
      const log = await prisma.emailLog.create({
        data: {
          to,
          subject,
          htmlContent: html,
          status: "pending",
        }
      });
      emailLogId = log.id;
    } else {
      // 1b. Se já existe, volta para pending e limpa erro
      await prisma.emailLog.update({
        where: { id: existingLogId },
        data: {
          status: "pending",
          errorMessage: null,
          sentAt: null,
        }
      });
    }

    // 2. Envia o e-mail via Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY as string,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "Chá Revelação", email: "rfpita.work@gmail.com" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`Brevo API Error: ${data.message || response.statusText}`);
    }
    
    // 3. Atualiza o log para 'sent'
    if (emailLogId) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "sent",
          sentAt: new Date(),
        }
      });
    }
    console.log(`E-mail enviado para ${to}`);
  } catch (error: any) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    
    // 4. Se falhou, atualiza o log para 'failed' com a mensagem de erro
    if (emailLogId) {
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "failed",
          errorMessage: error?.message || String(error),
        }
      });
    }
  }
};

// ==========================================
// Templates
// ==========================================

export const sendRsvpConfirmation = async (email: string, name: string, eventTitle: string, eventDateStr: string, locationStr: string, googleMapsUrl: string | null, isAttending: boolean = true, isUpdate: boolean = false) => {
  let subject = "Recebemos sua confirmação de presença! 🎉";
  if (!isAttending) subject = "Atualização sobre sua presença 😢";
  else if (isUpdate) subject = "Sua confirmação de presença foi atualizada! 🎉";
  
  const locationHtml = locationStr ? `
        <ul style="list-style-type: none; padding-left: 0; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <li style="margin-bottom: 10px;">📅 <strong>Quando:</strong> ${eventDateStr}</li>
          <li style="margin-bottom: 10px;">📍 <strong>Onde:</strong> ${locationStr}</li>
          ${googleMapsUrl ? `<li>🗺️ <a href="${googleMapsUrl}" style="color: #6fa8dc; text-decoration: none; font-weight: bold;">Ver no Google Maps</a></li>` : ''}
        </ul>
  ` : '';

  const attendingHtml = `
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        <h2 style="color: #f6b26b; margin: 0;">${isUpdate ? 'Dados Atualizados!' : 'Obrigado por confirmar!'}</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>${isUpdate ? `Os dados da sua presença no ${eventTitle || "nosso Chá Revelação (Miguel ou Rafaella?)"} foram atualizados com sucesso!` : `Sua presença no ${eventTitle || "nosso Chá Revelação (Miguel ou Rafaella?)"} está confirmadíssima! Estamos muito felizes que você vai compartilhar esse momento especial conosco.`}</p>
        
        ${locationHtml}
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-radius: 8px; text-align: center;">
          <h3 style="color: #6fa8dc; margin-top: 0;">Ainda não escolheu um presente? 🎁</h3>
          <p style="font-size: 14px;">Se quiser nos presentear com algo da nossa listinha, é só clicar no botão abaixo:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/#presentes" style="display: inline-block; padding: 12px 24px; background-color: #f6b26b; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-top: 10px;">Ver Lista de Presentes</a>
        </div>

        <div style="margin: 30px 0; padding: 20px; background-color: #fff9f9; border-radius: 8px; text-align: center; border: 1px dashed #f6b26b;">
          <h3 style="color: #f6b26b; margin-top: 0;">Deixe um recadinho! 💌</h3>
          <p style="font-size: 14px;">Deixe uma mensagem cheia de carinho no nosso mural. Nós vamos guardar com muito amor!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/#mural" style="display: inline-block; padding: 12px 24px; background-color: #6fa8dc; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-top: 10px;">Deixar Recado</a>
        </div>
        
        <p>Nos vemos em breve!</p>
        <p>Com carinho,<br>Os papais.</p>
      </div>
  `;

  const notAttendingHtml = `
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        <h2 style="color: #6fa8dc; margin: 0;">Sentiremos sua falta!</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos o aviso de que você não poderá comparecer ao ${eventTitle || "nosso Chá Revelação (Miguel ou Rafaella?)"}.</p>
        <p>Sentiremos muito a sua falta, mas sabemos que estará conosco em coração!</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #fff9f9; border-radius: 8px; text-align: center; border: 1px dashed #f6b26b;">
          <h3 style="color: #f6b26b; margin-top: 0;">Deixe um recadinho! 💌</h3>
          <p style="font-size: 14px;">Deixe uma mensagem cheia de carinho no nosso mural. Nós vamos guardar com muito amor!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/#mural" style="display: inline-block; padding: 12px 24px; background-color: #6fa8dc; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-top: 10px;">Deixar Recado</a>
        </div>
        
        <p>Com carinho,<br>Os papais.</p>
      </div>
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      ${isAttending ? attendingHtml : notAttendingHtml}
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendGiftConfirmation = async (email: string, name: string, orderCode: string, paymentMethod: string, paymentStatus: string, giftName: string) => {
  let subject = "Recebemos o seu presente! 💖";
  let content = "";

  if (paymentMethod === "pix" && paymentStatus === "pending") {
    subject = "Falta pouco para confirmar o seu presente! ⏳";
    content = `
      <h2 style="color: #f6b26b; margin: 0;">Aguardando Pagamento</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Falta muito pouco para concluir a sua contribuição para o presente <strong>"${giftName}"</strong>.</p>
        <p>O seu pedido de número <strong>${orderCode}</strong> está aguardando o pagamento do Pix.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/presentes/conclusao/${orderCode}" style="display: inline-block; padding: 12px 24px; background-color: #f6b26b; color: white; text-decoration: none; font-weight: bold; border-radius: 20px;">Ver código Pix</a>
        </div>
    `;
  } else {
    content = `
      <h2 style="color: #6fa8dc; margin: 0;">Presente Confirmado!</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>O seu presente <strong>"${giftName}"</strong> já foi confirmado! Agradecemos de coração pelo carinho.</p>
        <p>O número do seu pedido é <strong>${orderCode}</strong>.</p>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        ${content}
        <p>Com carinho,<br>Os papais.</p>
      </div>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendPixReminder = async (email: string, name: string, orderCode: string, giftName: string) => {
  const subject = "Seu presente está quase lá! Última chance 🏃‍♀️";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        <h2 style="color: #f6b26b; margin: 0;">Você ainda quer nos presentear?</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Vimos que você reservou o presente <strong>"${giftName}"</strong> (Pedido ${orderCode}), mas o pagamento do Pix ainda não foi concluído.</p>
        <p>Você ainda pode finalizar o pagamento ou, se preferir, escolher um outro presente na nossa lista de forma fácil pelo botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/presentes/conclusao/${orderCode}" style="display: inline-block; padding: 12px 24px; background-color: #6fa8dc; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-right: 10px;">Pagar Este Presente</a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://revelacaobabypita1.vercel.app"}/#presentes" style="display: inline-block; padding: 12px 24px; background-color: #f6b26b; color: white; text-decoration: none; font-weight: bold; border-radius: 20px;">Escolher Outro</a>
        </div>
        <p>Obrigado pelo carinho de sempre!</p>
      </div>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendEventReminder = async (email: string, name: string, eventTitle: string, eventDateStr: string, locationStr: string, googleMapsUrl: string | null) => {
  const subject = "O grande dia está chegando! Faltam 3 dias! 👶🎈";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        <h2 style="color: #6fa8dc; margin: 0;">Contagem Regressiva!</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Estamos super ansiosos e passamos para lembrar que faltam apenas <strong>3 dias</strong> para o ${eventTitle}!</p>
        <ul style="list-style-type: none; padding-left: 0; background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
          <li style="margin-bottom: 10px;">📅 <strong>Quando:</strong> ${eventDateStr}</li>
          <li style="margin-bottom: 10px;">📍 <strong>Onde:</strong> ${locationStr}</li>
          ${googleMapsUrl ? `<li>🗺️ <a href="${googleMapsUrl}" style="color: #6fa8dc; text-decoration: none; font-weight: bold;">Ver no Google Maps</a></li>` : ''}
        </ul>
        <p>Não vemos a hora de celebrar esse momento mágico com você!</p>
        <p>Até logo,<br>Os papais.</p>
      </div>
    </div>
  `;
  await sendEmail(email, subject, html);
};
