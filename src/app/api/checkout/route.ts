import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixPayment, createCardPreference } from "@/services/payment";
import { sendGiftConfirmation } from "@/lib/email";

// Função para gerar código legível de pedido (Ex: CHA-942851)
function generateOrderCode() {
  const code = Math.floor(100000 + Math.random() * 900000);
  return `CHA-${code}`;
}

// Função para gerar código de acesso alfanumérico único para o pedido
function generateAccessCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      gifterName,
      gifterEmail,
      gifterPhone,
      message,
      isAnonymous,
      paymentMethod, // pix, card, personal, link
    } = body;

    // 1. Validações de Identificação
    if (!sessionId || !gifterName || !gifterEmail || !gifterPhone || !paymentMethod) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const cleanPhone = gifterPhone.replace(/\D/g, "");

    // 2. Transação no Banco de Dados: Valida estoque e cria o pedido de forma segura (Prevenção de Sobrevenda)
    const result = await prisma.$transaction(async (tx) => {
      // A. Busca o carrinho e seus itens simples
      const cart = await tx.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Seu carrinho de presentes está vazio.");
      }

      // Busca os dados físicos dos presentes
      const giftIds = cart.items.map((i) => i.giftId);
      const gifts = await tx.gift.findMany({
        where: { id: { in: giftIds } },
      });

      const giftsMap = new Map(gifts.map((g) => [g.id, g]));

      // B. Valida disponibilidade de cada presente antes de alterar o estoque
      const giftsToUpdate = [];
      let totalValue = 0;

      for (const item of cart.items) {
        const gift = giftsMap.get(item.giftId);
        if (!gift) {
          throw new Error("Um dos presentes do seu carrinho não foi localizado no catálogo.");
        }
        
        const available = gift.maxQuantity - gift.chosenQuantity;

        if (item.quantity > available) {
          throw new Error(
            `O presente "${gift.name}" excedeu o limite disponível. (${available} restante(s) no momento).`
          );
        }

        totalValue += parseFloat(gift.value.toString()) * item.quantity;
        giftsToUpdate.push({
          giftId: gift.id,
          newChosenQuantity: gift.chosenQuantity + item.quantity,
          price: parseFloat(gift.value.toString()),
          name: gift.name,
          quantity: item.quantity,
        });
      }

      // C. Atualiza a quantidade escolhida de cada presente no banco de dados
      for (const update of giftsToUpdate) {
        await tx.gift.update({
          where: { id: update.giftId },
          data: {
            chosenQuantity: update.newChosenQuantity,
            status: update.newChosenQuantity >= (await tx.gift.findUnique({ where: { id: update.giftId } }))!.maxQuantity 
              ? "out_of_stock" 
              : "available",
          },
        });
      }

      // D. Gera códigos exclusivos
      const orderCode = generateOrderCode();
      const accessCode = generateAccessCode();

      // E. Cria o Pedido (Order)
      // Por padrão de privacidade, o status da entrega inicia como pendente
      const order = await tx.order.create({
        data: {
          code: orderCode,
          gifterName: gifterName.trim(),
          gifterEmail: gifterEmail.trim().toLowerCase(),
          gifterPhone: cleanPhone,
          message: message ? message.trim() : null,
          isAnonymous: !!isAnonymous,
          totalValue,
          paymentMethod,
          paymentStatus: paymentMethod === "personal" || paymentMethod === "link" ? "pending" : "pending",
          deliveryStatus: "pending",
          accessCode,
        },
      });

      // F. Cria os itens do pedido (OrderItems)
      for (const update of giftsToUpdate) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            giftId: update.giftId,
            name: update.name,
            quantity: update.quantity,
            priceAtPurchase: update.price,
          },
        });
      }

      // G. Limpa o carrinho de compras do convidado
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      const giftNames = giftsToUpdate.map(g => g.name).join(", ");
      return { order, totalValue, giftNames };
    });

    const { order, totalValue, giftNames } = result;

    // 3. Processamento de Pagamento (Fora da Transação SQL para evitar bloqueios de latência da rede)
    let paymentData: any = null;

    if (paymentMethod === "pix") {
      // Gera o Pix
      const pixResult = await createPixPayment(
        order.code,
        totalValue,
        order.gifterEmail,
        order.gifterName
      );

      // Registra a transação Pix na tabela de pagamentos
      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionId: pixResult.transactionId,
          status: pixResult.status,
          gateway: "mercadopago",
          value: totalValue,
          pixCopiaCola: pixResult.copiaCola,
          pixQrCode: pixResult.qrCode,
          pixQrCodeUrl: pixResult.qrCodeUrl,
        },
      });

      paymentData = {
        copiaCola: pixResult.copiaCola,
        qrCode: pixResult.qrCode,
        qrCodeUrl: pixResult.qrCodeUrl,
      };

    } else if (paymentMethod === "card") {
      // Gera o link de pagamento do Cartão
      const cardResult = await createCardPreference(
        order.code,
        totalValue,
        order.gifterEmail
      );

      // Registra o ID da preferência na tabela de pagamentos
      await prisma.payment.create({
        data: {
          orderId: order.id,
          transactionId: cardResult.preferenceId,
          status: "pending",
          gateway: "mercadopago",
          value: totalValue,
        },
      });

      paymentData = {
        initPoint: cardResult.initPoint,
        preferenceId: cardResult.preferenceId,
      };
    }

    const response = NextResponse.json({
      success: true,
      message: "Pedido de presente finalizado com sucesso!",
      order: {
        code: order.code,
        gifterName: order.gifterName,
        totalValue: parseFloat(order.totalValue.toString()),
        paymentMethod: order.paymentMethod,
        accessCode: order.accessCode,
      },
      payment: paymentData,
    });

    // Salvar recado no Mural de Recados se houver
    if (message && message.trim()) {
      await prisma.guestMessage.create({
        data: {
          name: isAnonymous ? "Anônimo" : gifterName.trim(),
          message: message.trim(),
        }
      });
    }

    // Enviar email de confirmação assincronamente
    sendGiftConfirmation(
      order.gifterEmail,
      order.gifterName,
      order.code,
      order.paymentMethod,
      order.paymentStatus,
      giftNames
    ).catch(console.error);

    return response;

  } catch (error: any) {
    console.error("Erro no checkout:", error);
    // Erros gerados pela transação contendo a validação de estoque serão reportados aqui
    return NextResponse.json(
      { error: error.message || "Ocorreu um erro ao processar o seu checkout." },
      { status: 500 }
    );
  }
}
