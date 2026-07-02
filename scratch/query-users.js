const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:");
  for (const u of users) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
  }
  const addresses = await prisma.address.findMany();
  console.log("Addresses in DB:");
  for (const a of addresses) {
    console.log(`- ID: ${a.id}, Name: ${a.fullName}, Phone: ${a.phone}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
