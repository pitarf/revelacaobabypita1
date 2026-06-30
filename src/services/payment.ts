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
    token: settings?.pagSeguroToken || process.env.PAGSEGURO_TOKEN || "",
    isTest: false, // Produção
  };
}

const getBaseUrl = (isTest: boolean) => 
  isTest ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";

/**
 * Cria uma cobrança Pix no PagSeguro
 */
export async function createPixPayment(
  orderCode: string,
  totalValue: number,
  gifterEmail: string,
  gifterName: string
): Promise<PixPaymentResult> {
  const config = await getPaymentConfig();

  if (!config.token) {
    console.log(`[PAYMENT SIMULATOR] Gerando pagamento Pix para pedido ${orderCode}`);
    const mockTxId = `sim_pix_${Math.random().toString(36).substring(2, 15)}`;
    return {
      transactionId: mockTxId,
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      copiaCola: "00020101021226830014br.gov.bcb.pix2561api.pagseguro.com...",
      status: "pending",
    };
  }

  try {
    const url = `${getBaseUrl(config.isTest)}/orders`;
    const amountInCents = Math.round(totalValue * 100);

    const payload = {
      reference_id: orderCode,
      customer: {
        name: gifterName.trim() || "Convidado",
        email: gifterEmail || "convidado@charevelacao.com.br",
        tax_id: "00000000000" // Fallback se não tivermos coletado CPF (PagSeguro Sandbox exige CPF válido, em PROD pode passar sem se usar Checkout, mas no Order API PIX às vezes exige. Enviaremos um genérico se não tiver)
      },
      items: [
        {
          name: `Presente do Chá Revelação - Pedido ${orderCode}`,
          quantity: 1,
          unit_amount: amountInCents,
        }
      ],
      qr_codes: [
        {
          amount: {
            value: amountInCents
          }
        }
      ],
      notification_urls: [
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
      ]
    };

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
      throw new Error(`Erro na API do PagSeguro (PIX): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const qrCodeInfo = data.qr_codes[0];

    return {
      transactionId: data.id,
      qrCode: qrCodeInfo.links.find((l: any) => l.rel === "QRCODE")?.href || "", // Algumas vezes retorna o base64 aqui ou link da imagem
      copiaCola: qrCodeInfo.text,
      status: "pending",
    };
  } catch (error) {
    console.error("Falha ao criar Pix no PagSeguro:", error);
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

    const payload = {
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
              value: "1" // Apenas à vista
            }
          ]
        }
      ],
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/presentes/conclusao/${orderCode}?payment_status=pending`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/presentes/conclusao/${orderCode}?payment_status=pending`,
      notification_urls: [
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`
      ]
    };

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
