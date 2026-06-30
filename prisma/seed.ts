import "dotenv/config";
import { PrismaClient } from "../src/generated/client/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
console.log("DEBUG - DATABASE_URL length:", connectionString ? connectionString.length : 0);
console.log("DEBUG - DATABASE_URL starts with:", connectionString ? connectionString.substring(0, 30) : "empty");

if (!connectionString) {
  throw new Error("DATABASE_URL não está configurada no .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // 1. Criar Administrador Padrão
  const adminEmail = "admin@charevelacao.com.br";
  const existingAdmin = await prisma.administrator.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.administrator.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Pais do Miguel/Rafaella",
        role: "admin",
      },
    });
    console.log("✔ Administrador padrão criado: admin@charevelacao.com.br / admin123");
  } else {
    console.log("✔ Administrador já existe no banco de dados.");
  }

  // 2. Configurações de Aparência do Site (SiteSetting)
  console.log("Semeando configurações de aparência do site...");
  await prisma.siteSetting.deleteMany();
  await prisma.siteSetting.create({
    data: {
      siteTitle: "Chá Revelação - Miguel ou Rafaella?",
      siteDescription: "Venha participar do nosso Chá Revelação e deixar o seu palpite!",
      siteKeywords: "chá revelação, miguel, rafaella, bebê, ursinho, presentes",
      messageTitle: "Oi, queridos amigos e familiares!",
      messageText: "Eu ainda estou bem quentinho aqui na <strong>barriga da mamãe</strong>, mas já sinto todo o <strong>amor</strong> e <strong>carinho</strong> que vocês têm por mim. Logo, logo vou chegar para encher a vida de todo mundo de alegria!\n\nPreparamos esse site com muito amor para o <strong>meu Chá</strong> e para guardar os <strong>recadinhos especiais</strong> de vocês.\n\nPor aqui, vocês podem <strong>confirmar presença</strong>, dar o seu <strong>palpite sobre quem eu sou</strong> e escolher um presente na nossa <strong>Lista de Presentes</strong>. Mas fiquem à vontade: quem preferir também pode <strong>levar pessoalmente</strong> no dia.\n\nFizemos tudo com muito carinho para que vocês participem desse momento de um jeito <strong>prático e cheio de amor</strong>.",
      themeJson: JSON.stringify({
        primaryColor: "#57a3e2", // Azul Miguel
        secondaryColor: "#e0589a", // Rosa Rafaella
        bgColor: "#faf6f0", // Bege/Creme claro
        fontFamily: "Outfit",
        bearsEnabled: true,
        cloudsEnabled: true,
        starsEnabled: true,
      }),
    },
  });
  console.log("✔ Configurações visuais do site inicializadas.");

  // 3. Configurações do Evento (EventSetting)
  console.log("Semeando configurações do evento...");
  await prisma.eventSetting.deleteMany();
  // Data: 18 de Julho de 2026 às 14:00 UTC-3 (Horário de Brasília)
  // 14:00 Horário de Brasília = 17:00 UTC
  const eventDate = new Date("2026-07-18T17:00:00.000Z");

  await prisma.eventSetting.create({
    data: {
      title: "Chá Revelação",
      babyOption1: "Miguel",
      babyOption2: "Rafaella",
      eventDate,
      eventTime: "14:00",
      locationName: "Espaço Kolina",
      address: "Rua Nabôr do Rêgo, 384 – Ramos",
      googleMapsUrl: "https://maps.app.goo.gl/W1VWq4w2wUpApKER7", // Real maps link
      deliveryAddress: "Rua Nabôr do Rêgo, 384 – Ramos (A/C Pais do Bebê)",
      deliveryInstructions: "Entregar em horário comercial. Caso não tenha ninguém, deixar com a portaria.",
      contactPhone: "(21) 99999-9999",
      showCountdown: true,
    },
  });
  console.log("✔ Configurações do evento inicializadas (18/07/2026 às 14h - Espaço Kolina).");

  // 4. Configurações de Pagamento (PaymentSetting)
  const paymentSettingsCount = await prisma.paymentSetting.count();
  if (paymentSettingsCount === 0) {
    await prisma.paymentSetting.create({
      data: {
        gateway: "mercadopago",
        maxInstallments: 5,
        feePolicy: "absorb", // absorb (pais pagam a taxa), add_to_customer (adiciona taxa na transação)
        isTestEnvironment: true,
        checkoutMessage: "Ao presentear via Pix ou Cartão, o valor correspondente será enviado diretamente aos pais para a compra do item físico.",
      },
    });
    console.log("✔ Configurações de pagamento inicializadas.");
  }

  // 5. Configurações de Música (MusicSetting)
  const musicSettingsCount = await prisma.musicSetting.count();
  if (musicSettingsCount === 0) {
    await prisma.musicSetting.create({
      data: {
        audioUrl: "/a_bencao.mp3",
        isActive: true,
        initialVolume: 0.3,
        autoRestart: true,
      },
    });
    console.log("✔ Configurações de música de fundo criadas.");
  }

  // 6. Criar Categorias Padrão
  const categoriesData = [
    { name: "Fraldas", slug: "fraldas", order: 1, icon: "FileText" },
    { name: "Higiene", slug: "higiene", order: 2, icon: "Sparkles" },
    { name: "Roupas", slug: "roupas", order: 3, icon: "Shirt" },
    { name: "Acessórios", slug: "acessorios", order: 4, icon: "Heart" },
    { name: "Móveis", slug: "moveis", order: 5, icon: "Home" },
    { name: "Brinquedos", slug: "brinquedos", order: 6, icon: "Smile" },
    { name: "Outros", slug: "outros", order: 7, icon: "MoreHorizontal" },
  ];

  const categoriesMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const existingCat = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existingCat) {
      const created = await prisma.category.create({
        data: cat,
      });
      categoriesMap[cat.slug] = created.id;
    } else {
      categoriesMap[cat.slug] = existingCat.id;
    }
  }
  console.log("✔ Categorias criadas/verificadas.");

  // 7. Criar Presentes Padrão de Demonstração
  const giftsCount = await prisma.gift.count();
  if (giftsCount === 0) {
    const defaultGifts = [
      {
        name: "Huggies Máxima Proteção M 40 unidades",
        description: "Fralda descartável tamanho M ideal para o dia a dia do bebê.",
        value: 76.00,
        maxQuantity: 5,
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60", // Placeholder de bebê/fralda genérico
        categorySlug: "fraldas",
        isFeatured: true,
      },
      {
        name: "Pampers Premium Care G 36 unidades",
        description: "Fralda tamanho G com canais de ar e máxima absorção.",
        value: 85.00,
        maxQuantity: 4,
        imageUrl: "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=500&auto=format&fit=crop&q=60",
        categorySlug: "fraldas",
        isFeatured: false,
      },
      {
        name: "Kit Sabonete Líquido e Shampoo Granado Bebê",
        description: "Kit com sabonete de glicerina de camomila e shampoo suave.",
        value: 45.00,
        maxQuantity: 3,
        imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60",
        categorySlug: "higiene",
        isFeatured: true,
      },
      {
        name: "Toalha de Banho Infantil com Capuz de Ursinho",
        description: "Toalha macia 100% algodão com capuz temático bordado.",
        value: 62.00,
        maxQuantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500&auto=format&fit=crop&q=60",
        categorySlug: "higiene",
        isFeatured: false,
      },
      {
        name: "Kit Body Manga Longa (3 unidades)",
        description: "Kit com 3 bodies confortáveis de algodão egípcio.",
        value: 75.00,
        maxQuantity: 3,
        imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60",
        categorySlug: "roupas",
        isFeatured: true,
      },
      {
        name: "Sapatinho de Crochê Branco Confort",
        description: "Lindo sapatinho de tricô antialérgico feito à mão.",
        value: 35.00,
        maxQuantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=60",
        categorySlug: "roupas",
        isFeatured: false,
      },
      {
        name: "Mamadeira Pétala Philips Avent 260ml",
        description: "Mamadeira ergonômica com bico em formato natural de pétala.",
        value: 98.00,
        maxQuantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&auto=format&fit=crop&q=60",
        categorySlug: "acessorios",
        isFeatured: true,
      },
      {
        name: "Chupeta Ultra Air Philips Avent (Duas unidades)",
        description: "Chupetas leves e respiráveis com escudo arredondado.",
        value: 58.00,
        maxQuantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60",
        categorySlug: "acessorios",
        isFeatured: false,
      },
      {
        name: "Móbile Musical Giratório para Berço Ursinhos",
        description: "Móbile com música de ninar e ursinhos suspensos decorativos.",
        value: 145.00,
        maxQuantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1617331140180-e8262094733a?w=500&auto=format&fit=crop&q=60",
        categorySlug: "moveis",
        isFeatured: true,
      },
      {
        name: "Mordedor com Água Resfriável Pezinho",
        description: "Mordedor macio livre de BPA, acalma as gengivas do bebê.",
        value: 25.00,
        maxQuantity: 5,
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
        categorySlug: "brinquedos",
        isFeatured: false,
      },
    ];

    for (const gift of defaultGifts) {
      const categoryId = categoriesMap[gift.categorySlug];
      if (categoryId) {
        await prisma.gift.create({
          data: {
            name: gift.name,
            description: gift.description,
            value: gift.value,
            maxQuantity: gift.maxQuantity,
            imageUrl: gift.imageUrl,
            categoryId: categoryId,
            isFeatured: gift.isFeatured,
            allowedPaymentMethods: "pix,card,personal,link",
          },
        });
      }
    }
    console.log("✔ Lista de presentes de demonstração semeada.");
  } else {
    console.log("✔ Presentes já existem no banco de dados.");
  }

  // 8. Placar de Votação Inicial Real
  console.log("Semeando placar de votação inicial...");
  await prisma.vote.deleteMany(); // Limpa votos anteriores para garantir o placar exato de 21 votos
  
  // Cria 16 votos para Miguel (76%)
  for (let i = 0; i < 16; i++) {
    await prisma.vote.create({
      data: {
        babyName: "Miguel",
        voterIp: `127.0.0.1`,
        createdAt: new Date(),
      },
    });
  }

  // Cria 5 votos para Rafaella (24%)
  for (let i = 0; i < 5; i++) {
    await prisma.vote.create({
      data: {
        babyName: "Rafaella",
        voterIp: `127.0.0.1`,
        createdAt: new Date(),
      },
    });
  }
  // 9. Semeando Imagens da Galeria do Ensaio Local
  console.log("Semeando imagens da galeria local...");
  await prisma.galleryImage.deleteMany(); // Garante que o banco contenha exatamente as fotos locais
  const localGalleryImages = [
    {
      imageUrl: "/capav1.jpg",
      caption: "Nossa doce espera começou!",
      isFeatured: true,
      order: 1,
    },
    {
      imageUrl: "/capa 2v1.jpg",
      caption: "Amor que não cabe no peito.",
      isFeatured: false,
      order: 2,
    },
    {
      imageUrl: "/capa 3v1.jpg",
      caption: "Cada detalhe planejado com muito carinho.",
      isFeatured: false,
      order: 3,
    },
    {
      imageUrl: "/capa 4v1.jpg",
      caption: "À espera do nosso maior presente.",
      isFeatured: false,
      order: 4,
    },
    {
      imageUrl: "/capa 5v1.jpg",
      caption: "Família crescendo e transbordando alegria.",
      isFeatured: false,
      order: 5,
    },
  ];

  for (const img of localGalleryImages) {
    await prisma.galleryImage.create({
      data: img,
    });
  }
  console.log("✔ Imagens da galeria semeadas com sucesso!");

  console.log("Semeadura concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante a semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
