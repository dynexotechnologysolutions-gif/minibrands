const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.userProfile.findMany({
    include: { user: true, addresses: true, seller: true }
  });
  console.log("Profiles in DB:");
  for (const p of profiles) {
    console.log(`- Profile ID: ${p.id}, User ID: ${p.userId}, Email: ${p.user.email}, Role: ${p.role}`);
    console.log(`  Store: ${p.seller ? p.seller.businessName : 'None'}`);
    console.log(`  Addresses (${p.addresses.length}):`);
    for (const a of p.addresses) {
      console.log(`    * Address ID: ${a.id}, Phone: ${a.phone}, Default: ${a.isDefault}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
