const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProduct() {
  const productId = "2d36a9c5-c952-424e-925e-6d1bce1e37db";
  console.log("Checking product:", productId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        include: {
          userProfile: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!product) {
    console.log("--> Product DOES NOT EXIST in database!");
  } else {
    console.log("--> Product found!");
    console.log("Product Name:", product.name);
    console.log("isDeleted:", product.isDeleted);
    console.log("Seller Business Name:", product.seller.businessName);
    console.log("Seller Profile ID:", product.seller.userProfileId);
    console.log("Seller Owner Email:", product.seller.userProfile?.user?.email);
  }

  const allProducts = await prisma.product.findMany({
    take: 5,
    select: { id: true, name: true, sellerId: true, isDeleted: true }
  });
  console.log("\nSample products in DB:", allProducts);

  await prisma.$disconnect();
}

checkProduct().catch(console.error);
