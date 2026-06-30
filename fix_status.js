import { PrismaClient } from './src/generated/client/index.js';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.gift.updateMany({
    where: { status: 'active' },
    data: { status: 'available' }
  });
  console.log('Updated', count);
}
main().finally(() => prisma.$disconnect());
