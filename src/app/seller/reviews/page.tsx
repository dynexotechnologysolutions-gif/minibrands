import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SellerLayout from "@/components/seller/SellerLayout";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";

export const metadata = {
  title: "Customer Reviews | Seller Hub — Velvet Lane",
  description: "View ratings and customer feedback for your store catalog.",
};

export default async function SellerReviewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login?role=seller");
  }

  const userProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      seller: {
        include: {
          verification: true,
          reviews: {
            include: {
              buyer: { include: { user: true } },
              product: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!userProfile || userProfile.role !== "SELLER" || !userProfile.seller) {
    redirect("/login?role=seller");
  }

  const seller = userProfile.seller;
  const reviews = seller.reviews || [];

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const sellerInfo = {
    id: seller.id,
    businessName: seller.businessName,
    storeName: seller.storeName,
    isKycVerified: seller.verification?.kycStatus === "approved" || seller.verification?.kycStatus === "auto_approved",
    userEmail: userProfile.user.email,
  };

  return (
    <SellerLayout sellerInfo={sellerInfo}>
      {/* Title & Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-base border-b border-border-gray/40 pb-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">
            Customer Reviews & Ratings
          </h1>
          <p className="text-body-sm text-text-muted mt-1">
            Track customer satisfaction, feedback comments, and product ratings.
          </p>
        </div>

        <div className="flex items-center gap-sm bg-surface-container-lowest border border-border-gray px-md py-sm rounded-xl shadow-xs">
          <Star className="w-6 h-6 text-accent-yellow fill-accent-yellow" />
          <div>
            <p className="text-2xl font-black text-on-surface">{avgRating} / 5.0</p>
            <p className="text-[11px] text-text-muted font-bold uppercase">{reviews.length} Total Reviews</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-surface-container-lowest border border-border-gray rounded-xl p-lg space-y-md shadow-xs">
        {reviews.length === 0 ? (
          <div className="py-xxl text-center text-text-muted space-y-sm">
            <MessageSquare className="w-10 h-10 text-border-gray mx-auto" />
            <p className="font-headline-sm text-headline-sm text-on-surface">No Customer Reviews Yet</p>
            <p className="text-body-sm">When customers leave ratings on your delivered products, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-md divide-y divide-border-gray/30">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-md first:pt-0 space-y-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-xs">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? "text-accent-yellow fill-accent-yellow"
                              : "text-border-gray"
                          }`}
                        />
                      ))}
                      <span className="font-bold text-body-sm text-on-surface ml-xs">{rev.rating}.0</span>
                    </div>
                    <p className="text-body-sm font-bold text-on-surface mt-xs">
                      {rev.buyer?.user?.name || "Verified Buyer"} &bull;{" "}
                      <span className="font-normal text-text-muted">Reviewed {rev.product?.name || "Product"}</span>
                    </p>
                  </div>
                  <span className="text-text-muted text-xs">
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>

                <p className="text-body-md text-on-surface/90 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
