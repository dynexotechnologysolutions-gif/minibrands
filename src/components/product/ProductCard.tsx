import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, AlertTriangle } from "lucide-react";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number; // in paise
    category: string;
    images: { url: string; cloudinaryPublicId: string }[];
    variants: { size: string; stockCount: number }[];
    seller: {
      businessName: string;
      verification?: {
        kycStatus: string;
        bankVerified: boolean;
      } | null;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0]?.url || "/placeholder.jpg";
  const formattedPrice = (product.price / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const isSellerVerified =
    product.seller.verification &&
    (product.seller.verification.kycStatus === "auto_approved" ||
      product.seller.verification.kycStatus === "approved") &&
    product.seller.verification.bankVerified;

  // Find any variant that has low stock (<= 3 and > 0)
  const lowStockVariant = product.variants?.find(
    (v) => v.stockCount > 0 && v.stockCount <= 3
  );

  const isOutOfStock =
    !product.variants ||
    product.variants.length === 0 ||
    product.variants.every((v) => v.stockCount === 0);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          priority={false}
        />

        {/* Floating Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
              Out of Stock
            </span>
          ) : lowStockVariant ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Only {lowStockVariant.stockCount} Left</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Info Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {/* Seller Name and Verification */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
              {product.seller.businessName}
            </span>
            {isSellerVerified && (
              <span className="inline-flex items-center text-emerald-600" title="Verified Seller">
                <BadgeCheck className="w-3.5 h-3.5 fill-emerald-50 text-emerald-600" />
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Pricing Info */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-extrabold text-slate-900 text-base">{formattedPrice}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
            {product.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
