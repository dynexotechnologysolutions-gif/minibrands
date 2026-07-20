import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function GET(request: Request) {
  try {
    await verifyAdminSession("moderate_reviews");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    if (search.trim()) {
      whereClause.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { seller: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        buyer: { include: { user: true } },
        seller: true,
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      buyerName: r.buyer.user.name || "Buyer",
      buyerEmail: r.buyer.user.email,
      sellerName: r.seller.businessName,
      productName: r.product.name,
      rating: r.rating,
      comment: r.comment,
      photoUrls: r.photoUrls,
      isVisible: r.isVisible,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ reviews: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reviews." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifyAdminSession("moderate_reviews");
    const body = await request.json();
    const { reviewId, action, reason } = body; // action: "HIDE" | "RESTORE" | "DELETE"

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.review.delete({ where: { id: reviewId } });
      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.profile.role,
        action: "DELETE_REVIEW",
        targetType: "Review",
        targetId: reviewId,
        oldValue: { isVisible: review.isVisible, comment: review.comment },
        newValue: null,
        reason: reason || "Review deleted by admin moderation.",
      });
      return NextResponse.json({ success: true, message: "Review deleted permanently." });
    }

    const isVisible = action === "RESTORE";
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isVisible },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: isVisible ? "RESTORE_REVIEW" : "HIDE_REVIEW",
      targetType: "Review",
      targetId: reviewId,
      oldValue: { isVisible: review.isVisible },
      newValue: { isVisible },
      reason: reason || `Review visibility set to ${isVisible}.`,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to moderate review." }, { status: 403 });
  }
}
