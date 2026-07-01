import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

interface PageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;

  // 1. Session check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login?role=seller");
  }

  const userId = session.user.id;

  // 2. Fetch user profile and verify role
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { seller: true },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

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

  // 4. Verify product exists, is not deleted, and belongs to the seller
  if (!product || product.isDeleted || product.seller.userProfileId !== userProfile.id) {
    notFound();
  }

  // Convert schema object to raw props matching the form expectation
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

  return (
    <div className="bg-slate-50 min-h-screen">
      <EditProductForm product={formattedProduct} />
    </div>
  );
}
