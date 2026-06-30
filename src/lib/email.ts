import nodemailer from "nodemailer";

const getTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_LOGIN || "", // Ex: your_email@domain.com
      pass: process.env.BREVO_SMTP_KEY || "", // Master password from Brevo
    },
  });
};

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.BREVO_SMTP_LOGIN) {
    console.warn("BREVO_SMTP_LOGIN não configurado. E-mail não será enviado.");
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: '"Chá Revelação" <charevelacao@babypita.com>', // Sender address
      to, // List of receivers
      subject, // Subject line
      html, // HTML body
    });
    console.log(`E-mail enviado para ${to}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
  }
};

// ==========================================
// Templates
// ==========================================

export const sendRsvpConfirmation = async (email: string, name: string) => {
  const subject = "Recebemos sua confirmação de presença! 🎉";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
        <h2 style="color: #f6b26b; margin: 0;">Obrigado por confirmar!</h2>
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Sua presença no nosso Chá Revelação (Miguel ou Rafaella?) está confirmadíssima! Estamos muito felizes que você vai compartilhar esse momento especial conosco.</p>
        
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

export const sendEventReminder = async (email: string, name: string, eventTitle: string, eventDateStr: string, locationStr: string) => {
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
          <li>📍 <strong>Onde:</strong> ${locationStr}</li>
        </ul>
        <p>Não vemos a hora de celebrar esse momento mágico com você!</p>
        <p>Até logo,<br>Os papais.</p>
      </div>
    </div>
  `;
  await sendEmail(email, subject, html);
};
