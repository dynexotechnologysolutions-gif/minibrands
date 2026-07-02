const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const buyer = await prisma.userProfile.findFirst({
    include: { user: true }
  });

  const product = await prisma.product.findFirst({
    where: { isDeleted: false, isPublished: true },
    include: { seller: true }
  });

  if (!buyer || !product) {
    console.log("Buyer or product not found. Buyer:", !!buyer, "Product:", !!product);
    return;
  }

  console.log(`Buyer: ${buyer.user.email} (ID: ${buyer.id})`);
  console.log(`Product: ${product.name} (ID: ${product.id})`);

  // Let's find or create a valid address for this buyer
  let address = await prisma.address.findFirst({
    where: { userProfileId: buyer.id }
  });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userProfileId: buyer.id,
        fullName: "Test Buyer",
        phone: "9876543210",
        line1: "123 Test Street",
        city: "Chennai",
        pincode: "600001"
      }
    });
  }

  // Find or create product variant
  let variant = await prisma.productVariant.findFirst({
    where: { productId: product.id }
  });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        size: "OS",
        stockCount: 10
      }
    });
  }

  // Let's create an order for this buyer and product, set status to delivered
  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      sellerId: product.sellerId,
      addressId: address.id,
      status: "delivered",
      totalAmount: 1000,
      commissionAmount: 100,
      paymentStatus: "paid",
      orderStatus: "delivered",
      items: {
        create: {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
          unitPrice: 1000
        }
      }
    }
  });

  console.log(`Created Order ID: ${order.id} with status delivered.`);

  // Let's fetch the product averageRating and reviewCount BEFORE submitting review
  let prodBefore = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Product Before - AvgRating: ${prodBefore.averageRating}, ReviewCount: ${prodBefore.reviewCount}`);

  // Now, let's call createReviewAction directly
  const txResult = await prisma.$transaction(async (tx) => {
    // Create the review
    const review = await tx.review.create({
      data: {
        orderId: order.id,
        buyerId: buyer.id,
        sellerId: product.sellerId,
        productId: product.id,
        rating: 5,
        comment: "Excellent cotton fabric saree!",
        photoUrls: []
      },
    });

    // Recalculate product average rating atomically
    const aggregate = await tx.review.aggregate({
      where: { productId: product.id, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newAvg = aggregate._avg.rating ?? 5;
    const newCount = aggregate._count.rating;

    await tx.product.update({
      where: { id: product.id },
      data: {
        averageRating: newAvg,
        reviewCount: newCount,
      },
    });

    return { review, newAvg, newCount };
  });

  console.log("Transaction executed successfully.");
  console.log(`Created Review ID: ${txResult.review.id}, isVisible: ${txResult.review.isVisible}`);
  console.log(`New Average: ${txResult.newAvg}, New Count: ${txResult.newCount}`);

  // Fetch product AFTER transaction
  let prodAfter = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Product After - AvgRating: ${prodAfter.averageRating}, ReviewCount: ${prodAfter.reviewCount}`);

  // Clean up
  await prisma.review.delete({ where: { id: txResult.review.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  console.log("Cleaned up temp data.");

  await prisma.$disconnect();
}

main().catch(console.error);
