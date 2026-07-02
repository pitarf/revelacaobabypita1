const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const guests = [
  { name: "Zuleide — mãe", group: "Família Rafael" },
  { name: "Raquel", group: "Família Rafael" },
  { name: "Maura", group: "Família Rafael" },
  { name: "Josélia", group: "Família Rafael" },
  { name: "Sueli Gonçalves", group: "Família Rafael" },
  { name: "Sueli Pita", group: "Família Rafael" },
  { name: "DJ Clau Clau", group: "Família Rafael" },
  { name: "Lucas", group: "Família Rafael" },
  { name: "Zesa", group: "Família Rafael" },
  { name: "Vanessa", group: "Família Rafael" },
  { name: "Lemar", group: "Família Rafael" },
  { name: "Ana Carolina", group: "Família Rafael" },
  { name: "Paulinho", group: "Família Rafael" },
  { name: "Michelle", group: "Família Rafael" },
  { name: "Valkíria", group: "Família Rafael" },
  { name: "Karine", group: "Família Rafael" },
  { name: "Neto", group: "Família Rafael" },
  { name: "Cauê", group: "Família Rafael" },
  { name: "José Carlos", group: "Família Rafael" },
  { name: "Ana", group: "Família Milena" },
  { name: "Mirella", group: "Família Milena" },
  { name: "Enoch", group: "Família Milena" },
  { name: "Eduardo", group: "Família Milena" },
  { name: "Janna", group: "Família Milena" },
  { name: "Vó Geralda", group: "Família Milena" },
  { name: "Vó Laureni", group: "Família Milena" },
  { name: "Jean", group: "Família Milena" },
  { name: "Hellen", group: "Família Milena" },
  { name: "Gui", group: "Família Milena" },
  { name: "Breno", group: "Família Milena" },
  { name: "Eliel", group: "Família Milena" },
  { name: "Héctor", group: "Família Milena" },
  { name: "Sofia", group: "Família Milena" },
  { name: "Elizeu", group: "Família Milena" },
  { name: "Suellen", group: "Família Milena" },
  { name: "Arthur", group: "Família Milena" },
  { name: "Miriam", group: "Família Milena" },
  { name: "Alan", group: "Família Milena" },
  { name: "Camila", group: "Família Milena" },
  { name: "Tia Lourdes", group: "Família Milena" },
  { name: "Mariana", group: "Família Milena" },
  { name: "Maycon", group: "Família Milena" },
  { name: "Duda", group: "Família Milena" },
  { name: "João", group: "Família Milena" },
  { name: "Isabelle", group: "Família Milena" },
  { name: "Namorado da Isabelle", group: "Família Milena" },
  { name: "Luciane", group: "Amigos" },
  { name: "Arlanda", group: "Amigos" },
  { name: "Evelyn", group: "Amigos" },
  { name: "Naila", group: "Amigos" },
  { name: "Yuri", group: "Amigos" },
  { name: "Karine", group: "Amigos" },
  { name: "Matheus", group: "Amigos" },
  { name: "Tenório", group: "Amigos" },
  { name: "Aline", group: "Amigos" },
  { name: "Lara", group: "Amigos" },
  { name: "Ana Vitória", group: "Amigos" },
  { name: "Iago", group: "Amigos" },
  { name: "Josemir", group: "Amigos" },
  { name: "Karen", group: "Amigos" },
  { name: "Namorado da Karen", group: "Amigos" },
  { name: "Teca", group: "Amigos" },
  { name: "Lincoln", group: "Amigos" },
  { name: "Ágata", group: "Amigos" },
  { name: "Yasmin — filha do Lincoln", group: "Amigos" },
  { name: "Luigi Brother", group: "Amigos" },
  { name: "Namorada do Matheus", group: "Amigos" },
  { name: "Evandro", group: "Amigos" },
  { name: "Gabi", group: "Amigos" },
  { name: "Ana Beatriz", group: "Amigos" },
  { name: "Luan", group: "Amigos" },
  { name: "Andressa Galdino", group: "Amigos" },
  { name: "Pastor Lucas", group: "Amigos" },
  { name: "Tamires", group: "Amigos" },
  { name: "Matheus Ferreira", group: "Amigos" },
  { name: "Sara", group: "Amigos" },
  { name: "Juan", group: "Amigos" },
  { name: "Agrício", group: "Amigos" },
  { name: "Letícia Creative", group: "Amigos" },
  { name: "Isabelle Creative", group: "Amigos" },
  { name: "Raquel Piscinão", group: "Amigos" },
  { name: "Eliane Piscinão", group: "Amigos" },
  { name: "Scarpede", group: "Amigos" },
  { name: "Carol", group: "Amigos" },
  { name: "Pai da Teca", group: "Amigos" },
  { name: "Mãe da Teca", group: "Amigos" },
  { name: "Irmã da Teca", group: "Amigos" },
  { name: "Fábio", group: "Convidados com um asterisco" },
  { name: "Sérgio", group: "Convidados com um asterisco" },
  { name: "Bia", group: "Convidados com um asterisco" },
  { name: "Esposa do Pastor João", group: "Convidados com um asterisco" },
  { name: "Pastor João", group: "Convidados com um asterisco" },
  { name: "Elias", group: "Convidados com um asterisco" },
  { name: "Marcelo", group: "Convidados com um asterisco" },
  { name: "Esposa do Marcelo", group: "Convidados com um asterisco" },
];

async function main() {
  console.log('Iniciando seed de convidados...');
  
  let inserted = 0;
  for (const guest of guests) {
    const existing = await prisma.guest.findFirst({
      where: { name: guest.name, group: guest.group }
    });
    
    if (!existing) {
      await prisma.guest.create({
        data: guest
      });
      inserted++;
    }
  }
  
  console.log(`Seed concluído. ${inserted} novos convidados adicionados!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
