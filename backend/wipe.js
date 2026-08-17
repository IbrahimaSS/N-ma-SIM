const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.paiement.deleteMany();
  await prisma.demandeSIM.deleteMany();
  await prisma.client.deleteMany();
  await prisma.log.deleteMany();
  console.log('Toutes les tables ont été vidées avec succès !');
}
main().catch(console.error).finally(() => prisma.$disconnect());
