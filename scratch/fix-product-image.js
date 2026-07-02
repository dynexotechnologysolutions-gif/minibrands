const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BAD_IMAGE_URL = "https://res.cloudinary.com/dgwlzoy6j/image/upload/v1781795040/velvetlane/products/f65b300b-16e8-46d7-847f-c664ec95e5f2/c3lcmotbq5gbnqri3nwr.png";
const GOOD_IMAGE_URL = "https://res.cloudinary.com/dgwlzoy6j/image/upload/v1781795287/velvetlane/products/f65b300b-16e8-46d7-847f-c664ec95e5f2/kdrdcstxvca51hnzrxdb.jpg";

async function main() {
  const result = await prisma.productImage.updateMany({
    where: { url: BAD_IMAGE_URL },
    data: { url: GOOD_IMAGE_URL }
  });
  console.log(`Updated ${result.count} product images from session timeout to saree image.`);
  await prisma.$disconnect();
}

main().catch(console.error);
