import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifyAdminSession("moderate_products");
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || "Failed catalog compliance guidelines.";

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.profile.role,
      action: "REJECT_PRODUCT",
      targetType: "Product",
      targetId: id,
      oldValue: { isPublished: product.isPublished },
      newValue: { isPublished: false },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" unpublished/rejected.`,
      product: updatedProduct,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to reject product." }, { status: 403 });
  }
}
