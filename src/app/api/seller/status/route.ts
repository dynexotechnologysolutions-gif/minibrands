import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        seller: {
          include: {
            verification: true,
          },
        },
      },
    });

    if (!userProfile || !userProfile.seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const seller = userProfile.seller;
    return NextResponse.json({
      success: true,
      status: seller.status,
      kycStatus: seller.verification?.kycStatus || "pending",
      bankVerified: seller.verification?.bankVerified || false,
      adminNotes: seller.adminNotes,
    });
  } catch (error: any) {
    console.error("Failed to get seller status:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
