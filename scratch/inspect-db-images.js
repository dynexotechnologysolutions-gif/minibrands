const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productImage.findMany({
    include: { product: true }
  });
  console.log("Product Images:");
  for (const img of images) {
    console.log(`- ID: ${img.id}, Product: ${img.product.name} (${img.product.id}), URL: ${img.url}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
