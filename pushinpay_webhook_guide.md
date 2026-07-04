# Guia de Configuração do Webhook PIX (PushinPay)

Esse guia contém a lógica exata que funcionou perfeitamente neste projeto para receber as confirmações de PIX da **PushinPay**. 
Siga esses passos no seu outro projeto para garantir que as confirmações cheguem.

---

## 1. Variáveis de Ambiente Necessárias (`.env`)

Certifique-se de que o outro projeto tem as seguintes chaves configuradas na Vercel e no `.env` local:

```env
# URL do projeto em produção para o webhook saber pra onde voltar
NEXT_PUBLIC_APP_URL="https://seu-outro-projeto.vercel.app"

# Token de acesso da API PushinPay (Gerado no Painel > Tokens de Acesso)
PUSHINPAY_TOKEN="seu_token_api_aqui"

# Token de Segurança do Webhook (Você quem cria esse token! Coloque uma senha segura aqui e use a mesma na configuração do webhook no painel da PushinPay)
PUSHINPAY_WEBHOOK_TOKEN="uma_senha_muito_segura_sua_123"
```

---

## 2. Na hora de gerar o PIX (Serviço de Pagamento)

Quando você for fazer o POST para criar o PIX na PushinPay (`https://api.pushinpay.com.br/api/pix/cashIn`), você **deve passar a URL do seu webhook na requisição**, enviando o código do pedido junto, como no exemplo:

```typescript
// Exemplo de como gerar o PIX passando a webhook_url corretamente:
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;

const payload = {
  value: amountInCents, // Valor em centavos
  // ENVIE A URL DO WEBHOOK JUNTO COM O CÓDIGO DO PEDIDO!
  webhook_url: `${appUrl}/api/webhooks/pushinpay?orderCode=${orderCode}`
};

// ... faz o fetch POST para "https://api.pushinpay.com.br/api/pix/cashIn"
```

---

## 3. A Rota do Webhook (Endpoint Next.js)

Crie o arquivo `src/app/api/webhooks/pushinpay/route.ts` (ou a rota correspondente do seu sistema) com a seguinte lógica de validação robusta:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de segurança do Webhook (Crucial para evitar aprovações falsas)
    const webhookToken = process.env.PUSHINPAY_WEBHOOK_TOKEN;
    
    if (webhookToken) {
      const headerToken = req.headers.get("x-pushinpay-token");

      if (headerToken !== webhookToken) {
        console.error("[Webhook PushinPay] Token inválido ou ausente. Recebido:", headerToken);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Leitura do corpo (aceitando raw body)
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      const searchParams = new URLSearchParams(rawBody);
      body = Object.fromEntries(searchParams.entries());
    }
    
    console.log("[Webhook PushinPay] Notificação recebida:", body);

    const transactionId = body.transaction_id || body.id;
    const status = body.status;
    const orderCode = req.nextUrl.searchParams.get("orderCode");

    if (!status) {
      return NextResponse.json({ error: "Missing status field" }, { status: 400 });
    }

    // 3. Verifica se realmente foi pago
    if (status !== "paid" && status !== "approved") {
      return NextResponse.json({ message: "Ignored status" }, { status: 200 });
    }

    // 4. Busca o pagamento no banco (Prioridade para o orderCode da URL que passamos na geração)
    let payment = null;
    
    if (orderCode) {
      const order = await prisma.order.findUnique({
        where: { code: orderCode },
        include: { payments: true }
      });
      if (order && order.payments.length > 0) {
        payment = await prisma.payment.findUnique({
          where: { id: order.payments[0].id }
        });
      }
    }

    // Fallback: Busca pelo ID da transação
    if (!payment && transactionId) {
      payment = await prisma.payment.findFirst({
        where: { transactionId }
      });
    }

    if (!payment) {
      console.error("[Webhook PushinPay] Pagamento não localizado. OrderCode:", orderCode);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({ message: "Payment already approved" }, { status: 200 });
    }

    // 5. Atualiza o status do banco de forma segura (usando $transaction do Prisma se possível)
    await prisma.$transaction(async (tx) => {
      // Atualiza pagamento
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "approved",
          netValue: parseFloat(payment.value.toString()) - 0.35, // 0.35 é a taxa fixa de PIX da Pushinpay
          feeValue: 0.35,
        }
      });

      // Atualiza o pedido principal
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "approved" }
      });
    });

    // 6. Responde 200 OK para a PushinPay parar de enviar a notificação
    console.log(`[Webhook PushinPay] Pedido ${orderCode} pago com sucesso!`);
    return NextResponse.json({ success: true, message: "OK" });

  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

---

## 4. Configuração no Painel da PushinPay

Embora a gente envie a `webhook_url` dinamicamente na hora de criar o PIX, **você precisa configurar o Token lá no painel deles**:

1. Acesse o [Painel da PushinPay](https://dashboard.pushinpay.com.br).
2. Vá no menu de Desenvolvedor / Webhooks.
3. No campo **Token do Webhook**, cole o exato valor que você colocou na sua variável `PUSHINPAY_WEBHOOK_TOKEN` (a "senha muito segura" que você inventou).
4. Assim, sempre que a PushinPay enviar a notificação pra sua rota, ela vai mandar esse token no cabeçalho `x-pushinpay-token`, garantindo segurança total de que o aviso veio da instituição de pagamento e não de um golpista forjando a aprovação!
