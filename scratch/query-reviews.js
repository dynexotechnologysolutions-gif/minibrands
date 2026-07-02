const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany();
  console.log(`Total reviews in DB: ${reviews.length}`);
  for (const r of reviews) {
    console.log(`- Review ID: ${r.id}, Product ID: ${r.productId}, Rating: ${r.rating}, isVisible: ${r.isVisible}, Comment: ${r.comment}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
