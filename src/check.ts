import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

// Função simples para calcular a distância de Levenshtein (similaridade entre strings)
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

async function main() {
  const guests = await prisma.guest.findMany({
    select: { name: true, group: true }
  });

  const exactDuplicates: Record<string, any[]> = {};
  const similarNames: Array<{name1: string, group1: string | null, name2: string, group2: string | null, distance: number}> = [];

  // Group exact duplicates (ignoring case/trim)
  for (const g of guests) {
    const key = g.name.trim().toLowerCase();
    if (!exactDuplicates[key]) exactDuplicates[key] = [];
    exactDuplicates[key].push(g);
  }

  // Find similar names
  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      const g1 = guests[i];
      const g2 = guests[j];
      
      const key1 = g1.name.trim().toLowerCase();
      const key2 = g2.name.trim().toLowerCase();
      
      if (key1 !== key2) { // don't compare exact matches here
        const dist = levenshteinDistance(key1, key2);
        const maxLength = Math.max(key1.length, key2.length);
        
        // If they are more than 80% similar, or just a few characters off
        if (dist <= 2 && maxLength > 4) {
          similarNames.push({
            name1: g1.name, group1: g1.group,
            name2: g2.name, group2: g2.group,
            distance: dist
          });
        }
      }
    }
  }

  console.log("=== DUPLICADOS EXATOS ===");
  Object.entries(exactDuplicates).forEach(([key, list]) => {
    if (list.length > 1) {
      console.log(`- "${list[0].name}" aparece ${list.length} vezes.`);
      list.forEach(item => console.log(`    Grupo: ${item.group || 'Sem grupo'}`));
    }
  });

  console.log("\n=== NOMES MUITO PARECIDOS ===");
  similarNames.forEach(s => {
    console.log(`- "${s.name1}" (Grupo: ${s.group1 || '-'}) <=> "${s.name2}" (Grupo: ${s.group2 || '-'})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
