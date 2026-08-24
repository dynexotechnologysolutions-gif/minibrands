"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  images: Array<{ url: string }>;
}

interface StorefrontFeaturedHeroProps {
  products: FeaturedProduct[];
  storeDisplayName: string;
}

export default function StorefrontFeaturedHero({ products, storeDisplayName }: StorefrontFeaturedHeroProps) {
  // Take up to 4 featured products
  const featured = products.slice(0, 4);

  if (featured.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
            Signature Showcase
          </h2>
          <p className="text-xs text-vl-muted">
            Curated highlight pieces selected by {storeDisplayName}
          </p>
        </div>
      </div>

      <div className="hide-scrollbar -mx-4 sm:-mx-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-0 pb-2">
        {featured.map((product) => {
          const imgUrl = product.images?.[0]?.url || "/placeholder.jpg";
          const formattedPrice = `₹${Math.round(product.price / 100).toLocaleString("en-IN")}`;

          return (
            <div
              key={product.id}
              className="w-[62vw] xs:w-[55vw] sm:w-[240px] shrink-0 snap-start rounded-vl-card border border-vl-border bg-vl-card overflow-hidden shadow-vl-soft hover:shadow-vl-medium transition-all group"
            >
              {/* Product Cover image */}
              <div className="relative aspect-[4/5] bg-vl-surface overflow-hidden">
                <Image
                  src={imgUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 62vw, 240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Lookbook Badge */}
                <span className="absolute left-3 top-3 rounded-full bg-vl-ink/80 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider">
                  Signature piece
                </span>
              </div>

              {/* Product info */}
              <div className="p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vl-muted">
                    {product.category}
                  </span>
                  <h3 className="font-vl-heading text-sm font-bold text-vl-ink truncate mt-0.5">
                    {product.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-vl-heading text-sm font-extrabold text-vl-primary">
                    {formattedPrice}
                  </span>
                  
                  <Link
                    href={`/products/${product.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-vl-ink text-white transition hover:bg-vl-primary"
                    aria-label={`View ${product.name}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
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
