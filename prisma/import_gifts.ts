import "dotenv/config";
import { PrismaClient } from "../src/generated/client/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurada no .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando importação de presentes do arquivo JSON...");
  
  // 1. Ler o arquivo JSON
  const jsonPath = "C:/Users/rfpit/.gemini/antigravity-ide/brain/8c101414-3f87-4026-8e37-ce8914a2047e/scratch/loadSiteResponse.json";
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo não encontrado em: ${jsonPath}`);
  }
  const rawData = fs.readFileSync(jsonPath, "utf8");
  const json = JSON.parse(rawData);
  const site = json.site;
  const lista = site.pages['0'].lista;
  const presentes = lista.presentes || [];
  
  console.log(`Encontrados ${presentes.length} presentes para importar.`);

  // 2. Garantir as categorias básicas e mapear seus IDs
  const categoriesData = [
    { name: "Fraldas", slug: "fraldas", order: 1, icon: "FileText" },
    { name: "Higiene", slug: "higiene", order: 2, icon: "Sparkles" },
    { name: "Roupas", slug: "roupas", order: 3, icon: "Shirt" },
    { name: "Acessórios", slug: "acessorios", order: 4, icon: "Heart" },
    { name: "Móveis", slug: "moveis", order: 5, icon: "Home" },
    { name: "Brinquedos", slug: "brinquedos", order: 6, icon: "Smile" },
    { name: "Outros", slug: "outros", order: 7, icon: "MoreHorizontal" },
  ];

  const categorySlugToId: Record<string, string> = {};
  for (const cat of categoriesData) {
    let dbCat = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (!dbCat) {
      dbCat = await prisma.category.create({
        data: cat,
      });
    }
    categorySlugToId[cat.slug] = dbCat.id;
  }
  console.log("✔ Categorias sincronizadas com o banco.");

  // Mapeamento de categoria_presente_id do JSON para slug
  const jsonCatIdToSlug: Record<number, string> = {
    1: "fraldas",
    2: "moveis",
    4: "acessorios",
    6: "roupas",
    7: "brinquedos",
    8: "higiene",
  };

  // 3. Deletar os presentes antigos
  console.log("Limpando presentes antigos da tabela...");
  await prisma.gift.deleteMany();
  console.log("✔ Tabela de presentes limpa.");

  // 4. Inserir os novos presentes
  let count = 0;
  for (const p of presentes) {
    const slug = jsonCatIdToSlug[p.categoria_presente_id] || "outros";
    const categoryId = categorySlugToId[slug];
    
    const rawValue = parseFloat(String(p.valorDecimal || p.valor).replace(",", "."));
    const value = Math.round(rawValue * 0.934);
    const imageUrl = p.img ? `https://www.chababy.com.br/${p.img}` : null;
    const maxQty = p.permitidos || 1;
    const chosenQty = p.comprados || 0;
    
    await prisma.gift.create({
      data: {
        name: p.nome,
        description: p.item_sugerido || `Presente da categoria ${slug}`,
        value,
        imageUrl,
        categoryId,
        maxQuantity: maxQty,
        chosenQuantity: chosenQty,
        status: (chosenQty >= maxQty) ? "out_of_stock" : "available",
        order: p.lista_id || 0,
        allowedPaymentMethods: "pix,card,personal,link",
      }
    });
    count++;
  }
  
  console.log(`✔ Importação concluída com sucesso! ${count} presentes inseridos.`);
}

main()
  .catch((e) => {
    console.error("Erro na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
