import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const email = "test_seller@velvet.com";
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const token = "mock-session-token-" + Math.random().toString(36).substring(2, 15);
  const sessionId = "session-" + Math.random().toString(36).substring(2, 15);
  
  await prisma.session.create({
    data: {
      id: sessionId,
      token: token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      ipAddress: "127.0.0.1",
      userAgent: "BrowserSubagent",
    },
  });

  console.log(`SESSION_CREATED`);
  console.log(`Cookie Name: better-auth.session_token`);
  console.log(`Cookie Value: ${token}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
