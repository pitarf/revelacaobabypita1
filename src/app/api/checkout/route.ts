import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPixPayment, createPushinPayPixPayment, createCardPreference } from "@/services/payment";
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
    if (!sessionId || !gifterName || !gifterEmail || !paymentMethod) {
      return NextResponse.json(
        { error: "Por favor, preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    const cleanPhone = gifterPhone ? gifterPhone.replace(/\D/g, "") : "";

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

      // G. O carrinho só será limpo APÓS o sucesso do gateway de pagamento
      // para evitar que o usuário perca o carrinho se a API do PagSeguro/PushinPay falhar.

      const giftNames = giftsToUpdate.map(g => g.name).join(", ");
      return { order, totalValue, giftNames, cartId: cart.id, giftsToUpdate };
    });

    const { order, totalValue, giftNames, cartId, giftsToUpdate } = result;

    // 3. Processamento de Pagamento (Fora da Transação SQL para evitar bloqueios de latência da rede)
    let paymentData: any = null;

    try {
      if (paymentMethod === "pix") {
      // Gera o Pix com PushinPay
      const pixResult = await createPushinPayPixPayment(
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
          gateway: "pushinpay",
          value: totalValue,
          pixQrCode: pixResult.qrCode,
          pixCopiaCola: pixResult.copiaCola,
        },
      });

      paymentData = {
        initPoint: `/presentes/conclusao/${order.code}`,
        preferenceId: pixResult.transactionId,
        qrCode: pixResult.qrCode,
        copiaCola: pixResult.copiaCola
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
          gateway: "pagseguro",
          value: totalValue,
        },
      });

      paymentData = {
        initPoint: cardResult.initPoint,
        preferenceId: cardResult.preferenceId,
      }
    } catch (paymentError: any) {
      console.error("[Checkout API] Falha na integração de pagamento, revertendo pedido:", paymentError);
      
      // Rollback manual do banco de dados já que o pagamento falhou
      await prisma.$transaction(async (tx) => {
        for (const update of giftsToUpdate) {
          await tx.gift.update({
            where: { id: update.giftId },
            data: {
              chosenQuantity: { decrement: update.quantity },
              status: "available" // força estar available pois reduziu a quantidade
            }
          });
        }
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        await tx.order.delete({ where: { id: order.id } });
      });
      
      throw paymentError; // repassa para o bloco catch principal
    }

    // 4. Sucesso total (Pedido salvo e gateway respondeu OK) -> Agora podemos limpar o carrinho
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });

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

    // Enviar email com QR Code do Pix (apenas para PIX, pois Cartão ainda não foi pago)
    if (order.paymentMethod === "pix") {
      try {
        await sendGiftConfirmation(
          order.gifterEmail,
          order.gifterName,
          order.code,
          order.paymentMethod,
          order.paymentStatus,
          giftNames
        );
      } catch (emailError) {
        console.error("Erro ao enviar email de pix pendente no checkout:", emailError);
      }
    }

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
