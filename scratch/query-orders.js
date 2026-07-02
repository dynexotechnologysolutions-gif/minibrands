const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      buyer: { include: { user: true } },
      seller: true,
      items: { include: { product: true } },
      review: true,
    }
  });
  console.log(`Total orders: ${orders.length}`);
  for (const o of orders) {
    console.log(`- Order ID: ${o.id}, Status: ${o.status}, Buyer: ${o.buyer.user.email}, Seller: ${o.seller.businessName}`);
    console.log(`  Items (${o.items.length}):`);
    for (const item of o.items) {
      console.log(`    * Item Name: ${item.product.name}, Product ID: ${item.product.id}`);
    }
    if (o.review) {
      console.log(`  Review ID: ${o.review.id}, Rating: ${o.review.rating}, isVisible: ${o.review.isVisible}`);
    } else {
      console.log(`  No review linked.`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
