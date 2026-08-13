import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: {
      userProfile: {
        include: {
          seller: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} users in database:`);
  for (const u of users) {
    console.log(`- Email: ${u.email}, Name: ${u.name}`);
    if (u.userProfile) {
      console.log(`  Profile Role: ${u.userProfile.role}, Profile ID: ${u.userProfile.id}`);
      if (u.userProfile.seller) {
        console.log(`  Seller Business: ${u.userProfile.seller.businessName}, Status: ${u.userProfile.seller.status}`);
      } else {
        console.log(`  No Seller profile`);
      }
    } else {
      console.log(`  No UserProfile record`);
    }
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
