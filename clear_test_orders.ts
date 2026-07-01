import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deletados ${deletedOrders.count} pedidos de teste.`);

    const updatedGifts = await prisma.gift.updateMany({
      data: {
        chosenQuantity: 0
      }
    });
    console.log(`Estoque de presentes resetado. (${updatedGifts.count} presentes atualizados)`);

  } catch (error) {
    console.error("Erro ao limpar dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
