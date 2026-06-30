const fs = require('fs');

async function run() {
  const token = "48adde83-9a7d-49a4-bd7f-6240562f5eecca39084f4ae2a2e59ff2359c3a9fab550233-ad4b-439d-9099-2c9cd3c752ba";
  const url = "https://sandbox.api.pagseguro.com/checkouts";
  
  const payload = {
    reference_id: "CHA-HOMOLOGACAO",
    customer: {
      name: "Teste de Homologacao",
      email: "homologacao@teste.com.br"
    },
    items: [
      {
        reference_id: "CHA-HOMOLOGACAO",
        name: "Presente do Chá Revelação",
        quantity: 1,
        unit_amount: 500
      }
    ],
    payment_methods: [
      {
        type: "PIX"
      }
    ],
    redirect_url: "https://babypita.vercel.app/presentes/conclusao/CHA-HOMOLOGACAO",
    return_url: "https://babypita.vercel.app/presentes/conclusao/CHA-HOMOLOGACAO",
    notification_urls: [
      "https://babypita.vercel.app/api/webhooks/payment"
    ]
  };

  console.log("Enviando requisição para o Sandbox do PagSeguro...");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  const fileContent = `==== REQUEST (ENVIADO PELO SITE NO AMBIENTE SANDBOX) ====
POST ${url}
Headers:
Authorization: Bearer [TOKEN OMITIDO POR SEGURANÇA]
Content-Type: application/json

Body:
${JSON.stringify(payload, null, 2)}


==== RESPONSE (RECEBIDO DO PAGSEGURO SANDBOX) ====
Status Code: ${response.status}

Body:
${JSON.stringify(data, null, 2)}
`;

  fs.writeFileSync('requisicoes.txt', fileContent);
  console.log("Arquivo requisicoes.txt atualizado com o teste SANDBOX!");
}

run().catch(console.error);
