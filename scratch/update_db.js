const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.systemSetting.updateMany({
    data: {
      mpAccessToken: 'APP_USR-4378253659446582-063013-8c4216a9d8aacafdc93dbc5300ea269e-1934658176',
      mpPublicKey: 'APP_USR-c61fdd55-6e96-40bb-af6d-dc84d86007e7'
    }
  });
  console.log('Database keys updated');
}

run().catch(console.error).finally(() => prisma.$disconnect());
