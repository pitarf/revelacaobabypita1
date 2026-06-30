import { prisma } from "@/lib/prisma";

export interface PixPaymentResult {
  transactionId: string;
  qrCode: string;
  copiaCola: string;
  qrCodeUrl?: string;
  status: string;
}

export interface CardPreferenceResult {
  preferenceId: string;
  initPoint: string;
}

/**
 * Retorna as credenciais de pagamento cadastradas no banco (ou fallback de variáveis de ambiente)
 */
async function getPaymentConfig() {
  const settings = await prisma.paymentSetting.findFirst();
  return {
    gateway: "pagseguro",
    token: "48adde83-9a7d-49a4-bd7f-6240562f5eecca39084f4ae2a2e59ff2359c3a9fab550233-ad4b-439d-9099-2c9cd3c752ba", // TEMP SANDBOX TOKEN
    isTest: true, // Forçando ambiente de testes
  };
}

const getBaseUrl = (isTest: boolean) => 
  isTest ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";

/**
 * Cria uma cobrança Pix no PagSeguro usando a API de Checkouts
 */
export async function createPixPayment(
  orderCode: string,
  totalValue: number,
  gifterEmail: string,
  gifterName: string
): Promise<any> {
  const config = await getPaymentConfig();

  if (!config.token) {
    console.log(`[PAYMENT SIMULATOR] Gerando pagamento Pix para pedido ${orderCode}`);
    const mockTxId = `sim_pix_${Math.random().toString(36).substring(2, 15)}`;
    return {
      transactionId: mockTxId,
      initPoint: `/presentes/conclusao/${orderCode}?payment_status=pending`,
      status: "pending",
    };
  }

  try {
    const url = `${getBaseUrl(config.isTest)}/checkouts`;
    const amountInCents = Math.round(totalValue * 100);

    const payload: any = {
      reference_id: orderCode,
      customer: {
        name: gifterName.trim() || "Convidado",
        email: gifterEmail || "convidado@charevelacao.com.br"
      },
      items: [
        {
          reference_id: orderCode,
          name: `Presente do Chá Revelação - Pedido ${orderCode}`,
          quantity: 1,
          unit_amount: amountInCents,
        }
      ],
      payment_methods: [
        {
          type: "PIX"
        }
      ]
    };

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;

    payload.redirect_url = `${appUrl}/presentes/conclusao/${orderCode}?payment_status=pending`;
    payload.return_url = `${appUrl}/presentes/conclusao/${orderCode}?payment_status=pending`;
    payload.notification_urls = [`${appUrl}/api/webhooks/payment`];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do PagSeguro (PIX Checkout): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const payUrl = data.links.find((l: any) => l.rel === "PAY")?.href;

    return {
      transactionId: data.id,
      initPoint: payUrl,
      status: "pending",
    };
  } catch (error) {
    console.error("Falha ao criar Pix Checkout no PagSeguro:", error);
    throw error;
  }
}

/**
 * Cria uma preferência de Checkout no PagSeguro
 */
export async function createCardPreference(
  orderCode: string,
  totalValue: number,
  gifterEmail: string
): Promise<CardPreferenceResult> {
  const config = await getPaymentConfig();

  if (!config.token) {
    console.log(`[PAYMENT SIMULATOR] Gerando link de Cartão para pedido ${orderCode}`);
    return {
      preferenceId: `sim_pref_${Math.random().toString(36).substring(2, 10)}`,
      initPoint: `/presentes/finalizar/cartao-simulado?code=${orderCode}`,
    };
  }

  try {
    const url = `${getBaseUrl(config.isTest)}/checkouts`;
    const amountInCents = Math.round(totalValue * 100);

    const payload: any = {
      reference_id: orderCode,
      customer: {
        name: "Convidado",
        email: gifterEmail || "convidado@charevelacao.com.br"
      },
      items: [
        {
          reference_id: orderCode,
          name: `Contribuição de Presentes - Chá Revelação ${orderCode}`,
          quantity: 1,
          unit_amount: amountInCents
        }
      ],
      payment_methods: [
        {
          type: "CREDIT_CARD"
        }
      ],
      payment_methods_configs: [
        {
          type: "CREDIT_CARD",
          config_options: [
            {
              option: "INSTALLMENTS_LIMIT",
              value: "5" // Permitir até 5x
            }
          ]
        }
      ]
    };

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;

    payload.redirect_url = `${appUrl}/presentes/conclusao/${orderCode}?payment_status=pending`;
    payload.return_url = `${appUrl}/presentes/conclusao/${orderCode}?payment_status=pending`;
    payload.notification_urls = [`${appUrl}/api/webhooks/payment`];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API de checkouts do PagSeguro: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const payUrl = data.links.find((l: any) => l.rel === "PAY")?.href;

    return {
      preferenceId: data.id,
      initPoint: payUrl,
    };
  } catch (error) {
    console.error("Falha ao criar preferência de cartão no PagSeguro:", error);
    throw error;
  }
}
