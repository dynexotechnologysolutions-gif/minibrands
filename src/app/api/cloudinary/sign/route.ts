import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCloudinarySignature } from "@/lib/cloudinary";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  try {
    // 1. Session verification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "You must be logged in to upload photos" },
        },
        { status: 401 }
      );
    }

    // 2. Fetch uploadType if specified in the body
    let uploadType = "product";
    try {
      const cloneReq = req.clone();
      const body = await cloneReq.json();
      if (body && body.uploadType) {
        uploadType = body.uploadType;
      }
    } catch (e) {
      // Body may not be present or not JSON
    }

    if (uploadType === "profile") {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = `velvetlane/profiles/${session.user.id}`;

      const apiSecret = process.env.CLOUDINARY_API_SECRET || "mock_cloudinary_secret";
      const apiKey = process.env.CLOUDINARY_API_KEY || "mock_cloudinary_key";
      const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME ||
        "mock_cloudinary_cloud";

      const signature = generateCloudinarySignature({ folder, timestamp }, apiSecret);

      return NextResponse.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      });
    }

    if (uploadType === "review") {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const folder = `velvetlane/reviews/${session.user.id}`;

      const apiSecret = process.env.CLOUDINARY_API_SECRET || "mock_cloudinary_secret";
      const apiKey = process.env.CLOUDINARY_API_KEY || "mock_cloudinary_key";
      const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME ||
        "mock_cloudinary_cloud";

      const signature = generateCloudinarySignature({ folder, timestamp }, apiSecret);

      return NextResponse.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      });
    }

    // 3. Fetch UserProfile and Seller details to verify activation status (for products)
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

    if (
      !userProfile ||
      userProfile.role !== "SELLER" ||
      !userProfile.seller ||
      !userProfile.seller.verification
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Only registered sellers can list products" },
        },
        { status: 403 }
      );
    }

    const verification = userProfile.seller.verification;
    const isVerified =
      verification &&
      (verification.kycStatus === "auto_approved" ||
        verification.kycStatus === "approved" ||
        verification.kycStatus === "manual_review") &&
      verification.bankVerified;

    if (!isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELLER_NOT_VERIFIED",
            message: "Complete seller identity and bank verification before uploading photos.",
          },
        },
        { status: 403 }
      );
    }


    // 3. Generate signed token parameters
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `velvetlane/products/${userProfile.seller.id}`;

    const apiSecret = process.env.CLOUDINARY_API_SECRET || "mock_cloudinary_secret";
    const apiKey = process.env.CLOUDINARY_API_KEY || "mock_cloudinary_key";
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "mock_cloudinary_cloud";

    const signature = generateCloudinarySignature({ folder, timestamp }, apiSecret);

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("[Cloudinary Sign Route Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to generate upload signature" },
      },
      { status: 500 }
    );
  }
}
