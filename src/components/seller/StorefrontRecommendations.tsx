"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  images: Array<{ url: string }>;
}

interface StorefrontRecommendationsProps {
  products: RecommendedProduct[];
}

export default function StorefrontRecommendations({ products }: StorefrontRecommendationsProps) {
  // Take up to 6 products for recommendations
  const recommended = products.slice(0, 6);

  if (recommended.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 border-t border-vl-border pt-10 sm:pt-16">
      <div>
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
          You May Also Like
        </h2>
        <p className="text-xs text-vl-muted">
          More curated finds from this boutique&rsquo;s catalog
        </p>
      </div>

      <div className="hide-scrollbar -mx-4 sm:-mx-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-0 pb-2">
        {recommended.map((product) => {
          const imgUrl = product.images?.[0]?.url || "/placeholder.jpg";
          const formattedPrice = `₹${Math.round(product.price / 100).toLocaleString("en-IN")}`;

          return (
            <div
              key={product.id}
              className="w-[62vw] xs:w-[50vw] sm:w-[220px] shrink-0 snap-start rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft hover:shadow-vl-medium transition-all group"
            >
              {/* Product Cover image */}
              <div className="relative aspect-[3/4] bg-vl-surface overflow-hidden">
                <Image
                  src={imgUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Product info */}
              <div className="p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-vl-muted">
                    {product.category}
                  </span>
                  <h3 className="font-vl-heading text-xs font-bold text-vl-ink truncate mt-0.5">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-vl-heading text-xs font-extrabold text-vl-primary">
                    {formattedPrice}
                  </span>
                  
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-vl-ink text-white transition hover:bg-vl-primary"
                    aria-label={`View ${product.name}`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
