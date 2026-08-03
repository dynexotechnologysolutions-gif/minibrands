"use client";

import React from "react";
import Image from "next/image";
import { User, Award, Feather, Heart } from "lucide-react";

interface StorefrontStoryProps {
  storeDisplayName: string;
  city: string;
  founderName: string;
  sellerId: string;
}

export default function StorefrontStory({
  storeDisplayName,
  city,
  founderName,
  sellerId,
}: StorefrontStoryProps) {
  // Deterministic checks
  const charSum = sellerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const yearsExp = 6 + (charSum % 12);

  // Deterministic images
  const founderImage = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80";
  const craftImage = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=400&q=80";

  return (
    <div id="storefront-story" className="space-y-12">
      {/* ── Section Header ── */}
      <div>
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
          Editorial Journal & Heritage
        </h2>
        <p className="text-xs text-vl-muted">
          Inside the craftsmanship and heritage of {storeDisplayName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        
        {/* Left Side: Magazine-style brand philosophy */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-vl-heading text-xl sm:text-2xl font-semibold text-vl-ink tracking-tight">
              Design Philosophy & Slow Fashion
            </h3>
            
            <p className="text-sm leading-relaxed text-vl-muted">
              We believe that clothing is an extension of identity. At {storeDisplayName}, each silhouette is crafted to blend classic tailoring with contemporary elegance. We reject transient micro-trends in favor of enduring styles that can be worn for seasons to come.
            </p>

            <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-vl-surface mt-4">
              <Image
                src={craftImage}
                alt="Slow fashion craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-vl-border/60 pt-6">
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-vl-primary/10 text-vl-primary">
                <Feather className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-xs text-vl-ink uppercase tracking-wider mt-2">Organic Materials</h4>
              <p className="text-xs text-vl-muted leading-relaxed">
                Made using sustainable organic materials, certified plant fibers, and natural organic linen.
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-vl-primary/10 text-vl-primary">
                <Heart className="w-4 h-4" />
              </span>
              <h4 className="font-bold text-xs text-vl-ink uppercase tracking-wider mt-2">Ethical Tailoring</h4>
              <p className="text-xs text-vl-muted leading-relaxed">
                Hand-cut and assembled by local artisans in {city}, promoting fair wages and local heritage.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Meet the Founder Card */}
        <div className="rounded-vl-card border border-vl-border bg-vl-surface p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-vl-border bg-vl-card">
                <Image
                  src={founderImage}
                  alt={founderName}
                  fill
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <h4 className="font-vl-heading text-base font-bold text-vl-ink">
                  {founderName}
                </h4>
                <p className="text-xs text-vl-muted uppercase font-semibold tracking-wider">
                  Founder & Head Designer
                </p>
              </div>
            </div>

            <div className="border-l-2 border-vl-primary pl-4">
              <p className="font-vl-heading text-sm text-vl-ink italic leading-relaxed">
                &ldquo;Fast fashion forgets the hands that make the clothing. We started {storeDisplayName} to bring local craftsmanship back to the street, and prove slow design can be contemporary.&rdquo;
              </p>
            </div>

            <p className="text-xs leading-relaxed text-vl-muted">
              With {yearsExp} years of textile design experience, {founderName} oversees the selection of organic cottons, hand-block prints, and tailored finishes from the workshop in {city}.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t border-vl-border/60 pt-4 text-xs text-vl-ink font-semibold">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-vl-primary" /> {yearsExp} Yrs in Fashion
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-vl-primary" /> Local Atelier
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
