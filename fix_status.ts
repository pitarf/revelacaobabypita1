import "dotenv/config";
import { prisma } from './src/lib/prisma';
async function main() {
  const count = await prisma.gift.updateMany({
    where: { status: 'active' },
    data: { status: 'available' }
  });
  console.log('Updated', count);
}
main().finally(() => prisma.$disconnect());
