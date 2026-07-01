const { PrismaClient } = require('./src/generated/client/index.js');
const prisma = new PrismaClient();

async function run() {
  try {
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deletados ${deletedOrders.count} pedidos de teste.`);
    const updatedGifts = await prisma.gift.updateMany({ data: { chosenQuantity: 0 } });
    console.log(`Estoque resetado (${updatedGifts.count} presentes).`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
