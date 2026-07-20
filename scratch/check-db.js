const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { userProfile: true },
  });
  const sellers = await prisma.seller.findMany({
    include: { verification: true },
  });
  const products = await prisma.product.findMany();
  const orders = await prisma.order.findMany();
  const returns = await prisma.returnRequest.findMany();

  console.log("=== DB SUMMARY ===");
  console.log("Users total:", users.length);
  users.forEach((u) => {
    console.log(`- ${u.email} (Role: ${u.userProfile?.role || "NONE"})`);
  });
  console.log("Sellers total:", sellers.length);
  sellers.forEach((s) => {
    console.log(`- Seller: ${s.businessName} (KYC: ${s.verification?.kycStatus || "NONE"})`);
  });
  console.log("Products total:", products.length);
  console.log("Orders total:", orders.length);
  console.log("Returns total:", returns.length);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
