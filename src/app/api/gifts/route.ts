import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const minPrice = parseFloat(searchParams.get("minPrice") || "") || null;
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "") || null;
    const search = searchParams.get("search")?.trim();
    const orderBy = searchParams.get("orderBy")?.trim() || "relevant";
    const onlyAvailable = searchParams.get("onlyAvailable") === "true";
    const onlyWithLink = searchParams.get("onlyWithLink") === "true";

    // 1. Monta as condições do filtro (where)
    const whereClause: any = {
      // Por padrão, não mostra presentes desativados/inativos na interface pública
      status: {
        not: "inactive",
      },
    };

    // Filtro por Categoria (slug)
    if (category && category !== "todos") {
      whereClause.category = {
        slug: category,
      };
    }

    // Filtro por busca de texto (Nome ou Descrição)
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por faixa de preço
    if (minPrice !== null || maxPrice !== null) {
      whereClause.value = {};
      if (minPrice !== null) {
        whereClause.value.gte = minPrice;
      }
      if (maxPrice !== null) {
        whereClause.value.lte = maxPrice;
      }
    }

    // Filtro apenas presentes disponíveis (estoque restante > 0)
    if (onlyAvailable) {
      // Como o Prisma não suporta expressão direta de coluna compare na cláusula where nativa sem raw sql,
      // usaremos um tratamento após puxar ou uma cláusula que garanta que não está esgotado
      whereClause.status = "available";
    }

    // Filtro apenas presentes com link externo
    if (onlyWithLink) {
      whereClause.externalLink = {
        not: null,
        path: { not: "" }, // garante que não está vazio
      };
    }

    // 2. Monta a ordenação (orderBy)
    let orderOption: any = {};
    if (orderBy === "name-asc") {
      orderOption = { name: "asc" };
    } else if (orderBy === "name-desc") {
      orderOption = { name: "desc" };
    } else if (orderBy === "price-asc") {
      orderOption = { value: "asc" };
    } else if (orderBy === "price-desc") {
      orderOption = { value: "desc" };
    } else if (orderBy === "most-chosen") {
      orderOption = { chosenQuantity: "desc" };
    } else if (orderBy === "recent") {
      orderOption = { createdAt: "desc" };
    } else {
      // Por relevância/prioridade (ordem definida no painel e ordenado por destaque primeiro)
      orderOption = [
        { isFeatured: "desc" },
        { category: { order: "asc" } },
        { order: "asc" },
        { name: "asc" },
      ];
    }

    // 3. Executa a consulta
    const gifts = await prisma.gift.findMany({
      where: whereClause,
      orderBy: orderOption,
      include: {
        category: true,
      },
    });

    // Filtra no código para casos onde a quantidade restante precisa ser validada dinamicamente
    const filteredGifts = gifts.filter((gift) => {
      const remaining = gift.maxQuantity - gift.chosenQuantity;
      
      // Se filtrou apenas disponíveis, garante que a conta restante seja > 0
      if (onlyAvailable && remaining <= 0) {
        return false;
      }

      // Se filtrou com link de compra externo, garante que de fato tenha o link
      if (onlyWithLink && (!gift.externalLink || gift.externalLink.trim() === "")) {
        return false;
      }

      return true;
    });

    // Formata os decimais para números para facilitar o consumo no React
    let formattedGifts = filteredGifts.map((gift) => ({
      ...gift,
      value: parseFloat(gift.value.toString()),
      remainingQuantity: Math.max(0, gift.maxQuantity - gift.chosenQuantity),
    }));

    // Regra de ordenação personalizada padrão
    if (!orderBy || orderBy === "relevant") {
      formattedGifts = formattedGifts.sort((a, b) => {
        const aIsFralda = a.name.toLowerCase().includes('fralda') || (a.category && a.category.name.toLowerCase().includes('fralda'));
        const bIsFralda = b.name.toLowerCase().includes('fralda') || (b.category && b.category.name.toLowerCase().includes('fralda'));

        // 1. Fraldas primeiro
        if (aIsFralda && !bIsFralda) return -1;
        if (!aIsFralda && bIsFralda) return 1;

        // 2. Se ambas são fraldas, menor valor primeiro
        if (aIsFralda && bIsFralda) {
          return a.value - b.value;
        }

        // 3. Se nenhuma é fralda, ordem alfabética
        return a.name.localeCompare(b.name);
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedGifts,
    });
  } catch (error) {
    console.error("Erro ao obter presentes:", error);
    return NextResponse.json({ error: "Erro ao carregar lista de presentes." }, { status: 500 });
  }
}
