const { PrismaClient } = require("@prisma/client");
const { Redis } = require("@upstash/redis");
const prisma = new PrismaClient();

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN || "",
});

async function main() {
  const users = await prisma.user.findMany({
    include: {
      userProfile: {
        include: {
          seller: true,
        }
      }
    }
  });
  console.log("Users count:", users.length);
  for (const u of users) {
    console.log(`User: ${u.email} (Profile ID: ${u.userProfile?.id}, Role: ${u.userProfile?.role})`);
    if (u.userProfile) {
      const keys = await redis.keys("reservation:*");
      const userRes = [];
      if (keys.length > 0) {
        for (const key of keys) {
          const val = await redis.get(key);
          if (val) {
            const data = typeof val === "string" ? JSON.parse(val) : val;
            if (data && data.userProfileId === u.userProfile.id) {
              userRes.push({ key, data });
            }
          }
        }
      }
      console.log(`  Active Reservations:`, userRes);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
