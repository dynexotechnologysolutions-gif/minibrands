import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { validateSessionAndRole } from "@/lib/auth-services/guard";
import { RedirectService } from "@/lib/auth-services/redirect.service";
import EditProductForm from "./EditProductForm";

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

import SellerLayout from "@/components/seller/SellerLayout";

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;

  const reqHeaders = await headers();
  const authResult = await validateSessionAndRole(reqHeaders, Role.SELLER);

  if (authResult.state === "NO_COOKIE" || authResult.state === "INVALID_SESSION") {
    redirect("/seller/login");
  }

  if (authResult.state === "EXPIRED_SESSION") {
    redirect(`/session-expired?redirectTo=%2Fseller%2Fproducts%2F${productId}%2Fedit`);
  }

  if (authResult.state === "ROLE_MISMATCH") {
    const userRole = authResult.userProfile?.role;
    const safeUrl = RedirectService.getFallbackForRole(userRole);
    redirect(safeUrl);
  }

  const userProfile = authResult.userProfile!;

  // 3. Fetch product including its images and variants
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: true,
      seller: true,
    },
  });

  // 4. Verify product exists and is not deleted
  if (!product || product.isDeleted) {
    notFound();
  }

  // 5. Verify ownership
  if (userProfile.role !== "ADMIN" && product.seller.userProfileId !== userProfile.id) {
    redirect("/seller/products");
  }

  const formattedProduct = {
    id: product.id,
    name: product.name,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    category: product.category,
    subcategory: product.subcategory,
    tags: product.tags,
    price: product.price,
    isPublished: product.isPublished,
    aiGenerated: product.aiGenerated,
    images: product.images.map((img) => ({
      url: img.url,
      cloudinaryPublicId: img.cloudinaryPublicId,
    })),
    variants: product.variants.map((v) => ({
      size: v.size,
      stockCount: v.stockCount,
    })),
  };

  const sellerInfo = userProfile.seller
    ? {
        id: userProfile.seller.id,
        businessName: userProfile.seller.businessName,
        storeName: userProfile.seller.storeName,
        isKycVerified:
          userProfile.seller.verification?.kycStatus === "approved" ||
          userProfile.seller.verification?.kycStatus === "auto_approved",
        userEmail: userProfile.user.email,
      }
    : undefined;

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      <EditProductForm product={formattedProduct} />
    </SellerLayout>
  );
}
