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
    gateway: settings?.gateway || "mercadopago",
    accessToken: settings?.mpAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
    publicKey: settings?.mpPublicKey || process.env.MERCADO_PAGO_PUBLIC_KEY || "",
    isTest: false, // Voltando para Produção
  };
}

/**
 * Cria uma cobrança Pix no Mercado Pago (ou simulada se não houver credenciais)
 */
export async function createPixPayment(
  orderCode: string,
  totalValue: number,
  gifterEmail: string,
  gifterName: string
): Promise<PixPaymentResult> {
  const config = await getPaymentConfig();

  // Se não possuir o token do Mercado Pago, roda o modo simulador resiliente e funcional
  if (!config.accessToken) {
    console.log(`[PAYMENT SIMULATOR] Gerando pagamento Pix para pedido ${orderCode}. Valor: R$ ${totalValue}`);
    
    // Gera dados falsos realistas para fins de teste e demonstração
    const mockTxId = `sim_pix_${Math.random().toString(36).substring(2, 15)}`;
    // Pix copia e cola fictício com visual padrão brasileiro
    const mockCopiaCola = `00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/${mockTxId}5204000053039865405${totalValue.toFixed(2)}5802BR5925Cha Revelacao Miguel Rafa6009Ramos RJ62070503***6304D1B9`;
    
    return {
      transactionId: mockTxId,
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // Pequeno pixel base64 para evitar quebra de imagem
      copiaCola: mockCopiaCola,
      qrCodeUrl: "#",
      status: "pending",
    };
  }

  try {
    const url = "https://api.mercadopago.com/v1/payments";
    
    // Limpa telefone e separa nome/sobrenome
    const names = gifterName.trim().split(" ");
    const firstName = names[0] || "Convidado";
    const lastName = names.slice(1).join(" ") || "Presente";

    const payload = {
      transaction_amount: Number(totalValue.toFixed(2)),
      description: `Presente do Chá Revelação - Pedido ${orderCode}`,
      payment_method_id: "pix",
      payer: {
        email: gifterEmail || "convidado@charevelacao.com.br",
        first_name: firstName,
        last_name: lastName,
      },
      ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? { notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment` }
        : {}),
      external_reference: orderCode,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${orderCode}-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Mercado Pago: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      transactionId: String(data.id),
      qrCode: data.point_of_interaction?.transaction_data?.qr_code_base64 ? `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}` : "",
      copiaCola: data.point_of_interaction?.transaction_data?.qr_code || "",
      qrCodeUrl: data.point_of_interaction?.transaction_data?.ticket_url || "",
      status: data.status, // pending
    };
  } catch (error) {
    console.error("Falha ao gerar Pix dinâmico no Mercado Pago:", error);
    throw error;
  }
}

/**
 * Cria uma preferência do Mercado Pago para pagamento via Cartão de Crédito
 */
export async function createCardPreference(
  orderCode: string,
  totalValue: number,
  gifterEmail: string
): Promise<CardPreferenceResult> {
  const config = await getPaymentConfig();

  // Se não possuir o token do Mercado Pago, roda o modo simulador
  if (!config.accessToken) {
    console.log(`[PAYMENT SIMULATOR] Gerando link de Cartão de Crédito para pedido ${orderCode}`);
    return {
      preferenceId: `pref_sim_${Math.random().toString(36).substring(2, 10)}`,
      initPoint: `/presentes/finalizar/cartao-simulado?code=${orderCode}`,
    };
  }

  try {
    const url = "https://api.mercadopago.com/checkout/preferences";
    
    const payload = {
      items: [
        {
          id: orderCode,
          title: `Contribuição de Presentes - Chá Revelação ${orderCode}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(totalValue.toFixed(2)),
        },
      ],
      payer: {
        email: gifterEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/presentes/conclusao/${orderCode}?payment_status=approved`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/presentes/conclusao/${orderCode}?payment_status=pending`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/presentes/conclusao/${orderCode}?payment_status=failure`,
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }, // exclui boleto
          { id: "bank_transfer" } // exclui outros além de cartão
        ],
        installments: 1, // Limita a 1 vez (pagamento à vista no crédito)
      },
      ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? { notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment` }
        : {}),
      external_reference: orderCode,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${orderCode}-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API de preferências do Mercado Pago: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      preferenceId: data.id,
      initPoint: config.isTest ? data.sandbox_init_point : data.init_point,
    };
  } catch (error) {
    console.error("Falha ao criar preferência de cartão de crédito no Mercado Pago:", error);
    throw error;
  }
}
