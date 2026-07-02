import { prisma } from "@/lib/prisma";

export class RestockService {
  /**
   * Processes restocking decisions for completed return request items.
   * Decrements/Increments variant stock counts based on the inspection result.
   */
  static async processRestocking(returnRequestId: string): Promise<void> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
      },
    });

    if (!returnRequest || !returnRequest.restockDecision) {
      console.log(`[RestockService] Skipping restock for return request: ${returnRequestId} (No restock approved).`);
      return;
    }

    console.log(`[RestockService] Executing restocking for Return Request ${returnRequestId}`);

    await prisma.$transaction(async (tx) => {
      for (const item of returnRequest.items) {
        const orderItem = item.orderItem;
        
        await tx.productVariant.update({
          where: { id: orderItem.variantId },
          data: {
            stockCount: {
              increment: item.quantity,
            },
          },
        });

        console.log(`[RestockService] Incremented stock count for variant ${orderItem.variantId} by +${item.quantity}`);
      }
    });
  }
}
