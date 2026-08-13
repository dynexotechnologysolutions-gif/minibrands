import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[MIGRATION] Starting storeLogo migration. Dry-run mode: ${dryRun}`);

  const sellers = await prisma.seller.findMany({
    where: {
      storeLogo: null,
    },
    include: {
      userProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(`[MIGRATION] Found ${sellers.length} sellers with null storeLogo.`);

  let migratedCount = 0;
  for (const seller of sellers) {
    const userImage = seller.userProfile?.user?.image;
    if (userImage) {
      console.log(`[MIGRATION] Seller "${seller.businessName}" (ID: ${seller.id}) has null storeLogo but owner has profile image: ${userImage}`);
      if (!dryRun) {
        await prisma.seller.update({
          where: { id: seller.id },
          data: { storeLogo: userImage },
        });
        console.log(`[MIGRATION] Successfully copied image to storeLogo.`);
      }
      migratedCount++;
    } else {
      console.log(`[MIGRATION] Seller "${seller.businessName}" (ID: ${seller.id}) has no owner image to copy.`);
    }
  }

  console.log(`[MIGRATION] Migration finished. Total migrated: ${migratedCount} (Dry run: ${dryRun})`);
}

run()
  .catch((e) => {
    console.error(`[MIGRATION] Error:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
