const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.userProfile.findMany({
    include: { user: true }
  });
  console.log(`Total users in UserProfile: ${users.length}`);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.user?.email}, Name: ${u.user?.name}, Role: ${u.role}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
