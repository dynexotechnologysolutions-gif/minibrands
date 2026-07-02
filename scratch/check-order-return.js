const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const orderId = "a282e40a-4674-4577-9845-ebe0c6ac2900";
  console.log("Checking order:", orderId);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      returnRequest: true,
      buyer: {
        include: {
          user: true
        }
      }
    }
  });

  if (!order) {
    console.log("Order DOES NOT EXIST in database!");
  } else {
    console.log("Order found:");
    console.log("Status:", order.status);
    console.log("Buyer Email:", order.buyer.user.email);
    console.log("Buyer Profile ID:", order.buyerId);
    console.log("Return Request:", order.returnRequest);
  }

  const allReturns = await prisma.returnRequest.findMany();
  console.log("Total return requests in DB:", allReturns.length);

  await prisma.$disconnect();
}

checkOrder().catch(console.error);
