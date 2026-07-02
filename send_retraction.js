require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://babypita.vercel.app";

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function sendEmail(to, subject, html) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: "Chá Revelação", email: "rfpita.work@gmail.com" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Brevo API Error: ${errorData.message || response.statusText}`);
  }
}

async function run() {
  const targetEmails = [
    "Coutinhonaila20@gmail.com",
    "duda03590@gmail.com",
    "vandagomesmelgaco@gmail.com",
    "Anaandrade0508@gmail.com",
    "Anamelgaco14@gmail.com",
    "elielalves7866@gmail.com",
    "Camilaschrapett102@gmail.com",
    "15anosdakarina@gmail.com",
    "zuleidegoncalvespita@gmail.com",
    "dudududaisa@gmail.com",
    "isabelledslima@hotmail.com",
    "marianamanuheloisa12@gmail.com"
  ].map(e => e.toLowerCase());

  console.log("Conectando ao banco de dados para buscar os convidados específicos...");
  
  const emailList = targetEmails.map(e => `'${e}'`).join(',');
  const res = await pool.query(`SELECT "fullName" as name, email, "accessCode" FROM rsvps WHERE LOWER(email) IN (${emailList})`);
  
  const rsvps = res.rows;
  console.log(`Encontrados ${rsvps.length} convidados com e-mail.`);

  let successCount = 0;
  let errorCount = 0;

  for (const rsvp of rsvps) {
    const { name, email, accessCode } = rsvp;

    const accessCodeHtml = `
          <div style="margin: 30px 0; padding: 20px; background-color: #fcf8f2; border-radius: 8px; text-align: center; border: 2px dashed #f6b26b;">
            <h3 style="color: #f6b26b; margin-top: 0; font-size: 18px;">Seu Código VIP de Acesso (Reenvio)</h3>
            <p style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #333; margin: 10px 0;">${accessCode}</p>
            <p style="font-size: 14px; margin-bottom: 0;">Guarde este código com carinho! Ele é sua chave para alterar sua presença ou interagir no nosso site.</p>
          </div>
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="text-align: center; padding: 20px; background-color: #fcf8f2; border-radius: 10px 10px 0 0;">
          <h2 style="color: #f6b26b; margin: 0;">Ops! O bebê chutou o teclado... 👶🍼</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fcf8f2;">
          <p>Olá, <strong>${name}</strong>!</p>
          <p>No e-mail que te enviamos agorinha com a sua confirmação, o bebê acabou apertando uns botões a mais e os links para o nosso site foram quebrados (quem sabe já é um programador(a) em treinamento? 😄).</p>
          
          <p>Viemos rapidinho retificar e te mandar os <strong>links certinhos</strong> do nosso site oficial para você conferir a Lista de Presentes ou deixar um Recadinho no Mural!</p>

          <div style="margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-radius: 8px; text-align: center;">
            <h3 style="color: #6fa8dc; margin-top: 0;">Ainda não escolheu um presente? 🎁</h3>
            <p style="font-size: 14px;">Se quiser nos presentear com algo da nossa listinha, é só clicar no botão abaixo:</p>
            <a href="${APP_URL}/#presentes" style="display: inline-block; padding: 12px 24px; background-color: #f6b26b; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-top: 10px;">Ver Lista de Presentes</a>
          </div>

          <div style="margin: 30px 0; padding: 20px; background-color: #fff9f9; border-radius: 8px; text-align: center; border: 1px dashed #f6b26b;">
            <h3 style="color: #f6b26b; margin-top: 0;">Deixe um recadinho! 💌</h3>
            <p style="font-size: 14px;">Deixe uma mensagem cheia de carinho no nosso mural. Nós vamos guardar com muito amor!</p>
            <a href="${APP_URL}/#mural" style="display: inline-block; padding: 12px 24px; background-color: #6fa8dc; color: white; text-decoration: none; font-weight: bold; border-radius: 20px; margin-top: 10px;">Deixar Recado</a>
          </div>

          ${accessCodeHtml}
          
          <p>Pedimos desculpas pela confusão e agradecemos muito pelo seu carinho. Nos vemos em breve!</p>
          <p>Com amor,<br>Os papais.</p>
        </div>
      </div>
    `;

    try {
      console.log(`Enviando retratação para ${name} (${email})...`);
      await sendEmail(email, "Ops! O bebê chutou o teclado... Links corrigidos! 👶🍼", html);
      successCount++;
    } catch (err) {
      console.error(`Erro ao enviar para ${email}:`, err.message);
      errorCount++;
    }

    await delay(500);
  }

  console.log("====================================");
  console.log(`Disparo Finalizado! Sucesso: ${successCount} | Erros: ${errorCount}`);
  pool.end();
}

run();
