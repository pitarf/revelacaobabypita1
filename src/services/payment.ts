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
    token: process.env.PAGSEGURO_TOKEN || settings?.pagSeguroToken || "", 
    isTest: false, // Forçando produção conforme solicitado 
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
 * Cria uma cobrança Pix usando a API da PushinPay
 */
export async function createPushinPayPixPayment(
  orderCode: string,
  totalValue: number,
  gifterEmail: string,
  gifterName: string
): Promise<PixPaymentResult> {
  const token = process.env.PUSHINPAY_TOKEN;
  
  if (!token) {
    console.log(`[PUSHINPAY SIMULATOR] Gerando pagamento Pix para pedido ${orderCode}`);
    const mockTxId = `sim_pushin_${Math.random().toString(36).substring(2, 15)}`;
    return {
      transactionId: mockTxId,
      qrCode: "00020101021226870014br.gov.bcb.pix2565qrcodesimulado1234567890",
      copiaCola: "00020101021226870014br.gov.bcb.pix2565qrcodesimulado1234567890",
      status: "pending",
    };
  }

  try {
    const amountInCents = Math.round(totalValue * 100);

    const payload: any = {
      value: amountInCents
    };

    if (process.env.PIX_PAYER_DOCUMENT) {
      payload.document = process.env.PIX_PAYER_DOCUMENT;
    }

    const response = await fetch("https://api.pushinpay.com.br/api/pix/cashIn", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API PushinPay: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    let qrCodeBase64 = data.qr_code_base64 || "";
    if (qrCodeBase64 && !qrCodeBase64.startsWith("data:image")) {
      qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
    }

    return {
      transactionId: data.id || data.transaction_id || `pushinpay_${orderCode}`,
      qrCode: qrCodeBase64,
      copiaCola: data.qr_code || data.copy_and_paste || "",
      status: "pending",
    };
  } catch (error) {
    console.error("Falha ao criar Pix na PushinPay:", error);
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
