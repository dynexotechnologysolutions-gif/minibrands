const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });
  for (const p of products) {
    console.log(`Product: ${p.name} (${p.category})`);
    for (const img of p.images) {
      console.log(`  - Image: ${img.url}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
