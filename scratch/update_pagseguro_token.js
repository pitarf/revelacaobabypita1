const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.paymentSetting.updateMany({
    data: {
      pagSeguroToken: 'e07e96df-a582-4956-80b0-ec43442cc61a32e17fc84269b6a81cf528003ad68f87bc1f-bf8e-4a1a-a17f-82022ce88501',
      gateway: 'pagseguro'
    }
  });
  console.log('PagSeguro Token updated in DB successfully!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
