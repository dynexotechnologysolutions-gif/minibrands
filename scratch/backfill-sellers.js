const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for sellers...");
  try {
    const result = await prisma.$transaction(async (tx) => {
      const sellers = await tx.seller.findMany({
        where: {
          storeName: ""
        }
      });
      console.log(`Found ${sellers.length} sellers to update.`);
      
      let count = 0;
      for (const seller of sellers) {
        await tx.seller.update({
          where: { id: seller.id },
          data: { storeName: seller.businessName }
        });
        count++;
      }
      return count;
    });
    console.log(`Backfill completed successfully. Updated ${result} sellers.`);
  } catch (error) {
    console.error("Backfill failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
