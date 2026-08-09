import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GuestOrderService } from "@/lib/guest-order.service";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Retrieve buyer profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "UserProfile not found" }, { status: 404 });
    }

    const normalizedSessionEmail = session.user.email.toLowerCase().trim();
    const tokenHash = GuestOrderService.hashGuestToken(token);

    // Run claim matching and updates transactionally
    const claimResult = await prisma.$transaction(async (tx) => {
      // Find the specific guest order by token hash
      const order = await tx.order.findUnique({
        where: { guestTokenHash: tokenHash },
      });

      if (!order) {
        throw new Error("Order not found or invalid token.");
      }

      // Check if already claimed by this user
      if (order.buyerId === userProfile.id) {
        return { success: true, alreadyClaimed: true };
      }

      // Block if claimed by another user
      if (order.buyerId !== null) {
        throw new Error("This order has already been claimed by another account.");
      }

      // Verify email ownership match
      if (!order.guestEmail || order.guestEmail !== normalizedSessionEmail) {
        throw new Error("The email address of this order does not match your account.");
      }

      // Verify token expiration
      if (order.guestTokenExpiresAt && order.guestTokenExpiresAt < new Date()) {
        throw new Error("The claim window for this order has expired.");
      }

      // Perform claim
      await tx.order.update({
        where: { id: order.id },
        data: {
          buyerId: userProfile.id,
          guestClaimedAt: new Date(),
        },
      });

      return { success: true, alreadyClaimed: false };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    return NextResponse.json(claimResult);
  } catch (error: any) {
    console.error("[Claim Guest Order API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to claim order" }, { status: 400 });
  }
}
