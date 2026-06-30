import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cart?sessionId=XXXXXX - Recupera itens do carrinho e valida disponibilidade de estoque
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId")?.trim();

    if (!sessionId) {
      return NextResponse.json({ items: [], totalValue: 0 }, { status: 200 });
    }

    // 1. Busca ou cria o carrinho
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: { items: true },
      });
    }

    // Busca os dados físicos dos presentes no carrinho
    const giftIds = cart.items.map((item) => item.giftId);
    const gifts = await prisma.gift.findMany({
      where: { id: { in: giftIds } },
      include: { category: true },
    });

    const giftsMap = new Map(gifts.map((g) => [g.id, g]));

    // 2. Valida disponibilidade de cada item em tempo real
    let adjusted = false;
    const cleanedItems = [];

    for (const item of cart.items) {
      const gift = giftsMap.get(item.giftId);
      if (!gift) {
        // Se o presente foi deletado, removemos do carrinho
        await prisma.cartItem.delete({
          where: { id: item.id },
        });
        adjusted = true;
        continue;
      }

      const available = Math.max(0, gift.maxQuantity - gift.chosenQuantity);

      if (available <= 0) {
        // Presente esgotou, removemos do carrinho
        await prisma.cartItem.delete({
          where: { id: item.id },
        });
        adjusted = true;
      } else if (item.quantity > available) {
        // Excedeu o estoque atual, ajustamos para o limite disponível
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { quantity: available },
        });
        item.quantity = available;
        adjusted = true;
        cleanedItems.push({ ...item, gift });
      } else {
        cleanedItems.push({ ...item, gift });
      }
    }

    // Calcula os totais do carrinho atualizados
    let totalValue = 0;
    const formattedItems = cleanedItems.map((item) => {
      const price = parseFloat(item.gift.value.toString());
      const subtotal = price * item.quantity;
      totalValue += subtotal;

      return {
        id: item.id,
        giftId: item.giftId,
        name: item.gift.name,
        imageUrl: item.gift.imageUrl,
        category: item.gift.category.name,
        price,
        quantity: item.quantity,
        subtotal,
        available: Math.max(0, item.gift.maxQuantity - item.gift.chosenQuantity),
        externalLink: item.gift.externalLink,
        allowedPaymentMethods: item.gift.allowedPaymentMethods || "pix,card,personal,link",
      };
    });

    return NextResponse.json({
      success: true,
      items: formattedItems,
      totalValue,
      adjusted,
    });
  } catch (error) {
    console.error("Erro ao recuperar carrinho:", error);
    return NextResponse.json({ error: "Erro ao processar carrinho." }, { status: 500 });
  }
}

// POST /api/cart - Adiciona, atualiza ou remove itens do carrinho
export async function POST(req: NextRequest) {
  try {
    const { sessionId, giftId, action, quantity } = await req.json();

    if (!sessionId || !giftId || !action) {
      return NextResponse.json({ error: "Parâmetros insuficientes." }, { status: 400 });
    }

    // 1. Valida o presente e seu estoque
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
    }

    if (gift.status !== "available") {
      return NextResponse.json({ error: "Este presente não está disponível no momento." }, { status: 400 });
    }

    const available = Math.max(0, gift.maxQuantity - gift.chosenQuantity);

    // 2. Busca ou cria o carrinho
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });
    }

    // 3. Busca o item no carrinho
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        giftId: gift.id,
      },
    });

    if (action === "add") {
      if (available <= 0) {
        return NextResponse.json({ error: "Desculpe, este presente já está esgotado." }, { status: 400 });
      }

      const addedQty = quantity || 1;
      const targetQty = (existingItem?.quantity || 0) + addedQty;

      if (targetQty > available) {
        return NextResponse.json({
          error: `Você já possui o limite deste item no carrinho. Limite disponível: ${available} unidade(s).`,
        }, { status: 400 });
      }

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: targetQty },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            giftId: gift.id,
            quantity: targetQty,
          },
        });
      }
    } else if (action === "update") {
      const targetQty = parseInt(quantity) || 1;

      if (targetQty > available) {
        return NextResponse.json({
          error: `Não há estoque suficiente. Limite disponível: ${available} unidade(s).`,
        }, { status: 400 });
      }

      if (targetQty <= 0) {
        if (existingItem) {
          await prisma.cartItem.delete({
            where: { id: existingItem.id },
          });
        }
      } else {
        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: targetQty },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              giftId: gift.id,
              quantity: targetQty,
            },
          });
        }
      }
    } else if (action === "remove") {
      if (existingItem) {
        await prisma.cartItem.delete({
          where: { id: existingItem.id },
        });
      }
    } else {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    // 4. Retorna a lista atualizada do carrinho com a junção manual
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });

    const updatedGiftIds = (updatedCart?.items || []).map((item) => item.giftId);
    const updatedGifts = await prisma.gift.findMany({
      where: { id: { in: updatedGiftIds } },
      include: { category: true },
    });

    const updatedGiftsMap = new Map(updatedGifts.map((g) => [g.id, g]));

    let totalValue = 0;
    const formattedItems = (updatedCart?.items || []).map((item) => {
      const g = updatedGiftsMap.get(item.giftId)!;
      const price = parseFloat(g.value.toString());
      const subtotal = price * item.quantity;
      totalValue += subtotal;

      return {
        id: item.id,
        giftId: item.giftId,
        name: g.name,
        imageUrl: g.imageUrl,
        category: g.category.name,
        price,
        quantity: item.quantity,
        subtotal,
        available: Math.max(0, g.maxQuantity - g.chosenQuantity),
        externalLink: g.externalLink,
      };
    });

    return NextResponse.json({
      success: true,
      items: formattedItems,
      totalValue,
    });
  } catch (error) {
    console.error("Erro ao manipular carrinho:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
