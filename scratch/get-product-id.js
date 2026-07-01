const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      isPublished: true,
      seller: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true
        }
      }
    },
    take: 5
  });
  console.log("Verified products:", products.map(p => ({ id: p.id, name: p.name, price: p.price })));
  await prisma.$disconnect();
}

main().catch(console.error);
