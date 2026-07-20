const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.userProfile.updateMany({
    data: {
      role: "ADMIN",
    },
  });
  console.log("Updated UserProfiles to ADMIN role:", result);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
