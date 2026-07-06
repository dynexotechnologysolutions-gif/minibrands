

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.sellerVerification.updateMany({
    data: {
      kycStatus: "auto_approved",
      bankVerified: true,
      verifiedAt: new Date(),
      trustScore: 95,
    }
  });
  console.log("Updated verification records:", result);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
