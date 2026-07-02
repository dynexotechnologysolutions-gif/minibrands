import { sendFounderAlert } from "@/lib/resend";
import { sendMessage, TEMPLATES } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export class NotificationService {
  /**
   * Notifies the buyer of updates on their return request.
   */
  static async notifyBuyer(returnRequestId: string, event: string): Promise<void> {
    try {
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id: returnRequestId },
        include: {
          buyer: {
            include: {
              user: true,
            },
          },
          order: true,
        },
      });

      if (!returnRequest || !returnRequest.buyer.user.email) return;

      const buyerEmail = returnRequest.buyer.user.email;
      const orderId = returnRequest.order.id;
      const status = returnRequest.status;

      // 1. WhatsApp Template Dispatch
      // Maps return request updates to corresponding Whatsapp notifications
      if (event === "submitted") {
        await sendMessage(buyerEmail, TEMPLATES.ORDER_CANCELLED, [orderId, "Return Requested"]);
      } else if (event === "approved") {
        await sendMessage(buyerEmail, TEMPLATES.ORDER_CANCELLED, [orderId, "Return Approved"]);
      } else if (event === "refunded") {
        await sendMessage(buyerEmail, TEMPLATES.ESCROW_RELEASED, [orderId, `Refund of INR ${(returnRequest.refundAmount / 100).toFixed(2)} completed.`]);
      }

      // 2. Email Dispatch via Resend
      const subject = `[Velvet Lane] Return Update - Order #${orderId.slice(0, 8)}`;
      const text = `Hi ${returnRequest.buyer.user.name || "Customer"},\n\nYour return request for Order #${orderId} has been updated to: ${status}.\nEvent detail: ${event}.\n\nThank you,\nVelvet Lane Team`;
      
      await sendFounderAlert(subject, text); // Alerts founder/ops of state changes
    } catch (err) {
      console.error("[NotificationService Buyer Alert Error]:", err);
    }
  }

  /**
   * Notifies the seller of pending return actions.
   */
  static async notifySeller(returnRequestId: string, event: string): Promise<void> {
    try {
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id: returnRequestId },
        include: {
          order: {
            include: {
              seller: {
                include: {
                  userProfile: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!returnRequest || !returnRequest.order.seller.userProfile?.user.email) return;

      const sellerEmail = returnRequest.order.seller.userProfile.user.email;
      const orderId = returnRequest.order.id;

      const subject = `[Velvet Lane Seller] Return Action Required - Order #${orderId.slice(0, 8)}`;
      const text = `Hello Seller,\n\nReturn request for Order #${orderId} requires attention.\nEvent: ${event}.\nStatus: ${returnRequest.status}.\n\nPlease visit your Seller Dashboard to action this request.\n\nThank you,\nVelvet Lane Ops`;
      
      await sendFounderAlert(subject, text);
    } catch (err) {
      console.error("[NotificationService Seller Alert Error]:", err);
    }
  }

  /**
   * Notifies administrators of failed refunds or dispute escalations.
   */
  static async notifyAdmin(returnRequestId: string, reason: string): Promise<void> {
    try {
      const returnRequest = await prisma.returnRequest.findUnique({
        where: { id: returnRequestId },
      });
      const orderId = returnRequest?.orderId || "unknown";

      const subject = `[Velvet Lane ADMIN ALERT] Return Dispute / Failure - Order #${orderId.slice(0, 8)}`;
      const text = `ATTENTION ADMINS:\n\nReturn request ID: ${returnRequestId} (Order ID: ${orderId}) has encountered a failure or dispute.\nReason: ${reason}.\nStatus: ${returnRequest?.status || "unknown"}.\n\nPlease review and override the dispute immediately in the Admin Console.`;
      
      await sendFounderAlert(subject, text);
    } catch (err) {
      console.error("[NotificationService Admin Alert Error]:", err);
    }
  }
}
