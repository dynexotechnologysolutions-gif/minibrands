"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface StorefrontCollectionsProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  productsCount: number;
}

export default function StorefrontCollections({
  categories,
  selectedCategory,
  setSelectedCategory,
  productsCount,
}: StorefrontCollectionsProps) {
  // Editorial imagery for lookbooks
  const collectionImages: Record<string, string> = {
    all: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
    ethnic: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    casual: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80",
    formal: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=600&q=80",
    western: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
  };

  const getCollectionImage = (cat: string) => {
    const key = cat.toLowerCase();
    return collectionImages[key] || collectionImages["all"];
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-vl-heading text-lg font-bold tracking-tight text-vl-ink">
          Shop by Collection
        </h2>
        <p className="text-xs text-vl-muted">
          Browse lookbooks and curated fashion edits
        </p>
      </div>

      <div className="hide-scrollbar -mx-4 sm:-mx-0 flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-2">
        {/* 'All' collection */}
        <div
          onClick={() => setSelectedCategory("all")}
          className={`relative w-[65vw] xs:w-[58vw] sm:w-[220px] shrink-0 snap-start aspect-[4/5] rounded-vl-card overflow-hidden bg-vl-surface shadow-vl-soft cursor-pointer transition-all duration-vl-standard border-2 ${
            selectedCategory === "all" ? "border-vl-primary scale-[0.98]" : "border-transparent hover:border-vl-primary/30"
          }`}
        >
          <Image
            src={getCollectionImage("all")}
            alt="All collections"
            fill
            sizes="220px"
            className="object-cover transition duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/90 via-vl-ink/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-vl-heading text-sm font-bold uppercase tracking-wider">All Designs</h3>
            <p className="text-[10px] opacity-75 mt-0.5">{productsCount} pieces listed</p>
          </div>
        </div>

        {/* Dynamic category collections */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative w-[65vw] xs:w-[58vw] sm:w-[220px] shrink-0 snap-start aspect-[4/5] rounded-vl-card overflow-hidden bg-vl-surface shadow-vl-soft cursor-pointer transition-all duration-vl-standard border-2 ${
                isActive ? "border-vl-primary scale-[0.98]" : "border-transparent hover:border-vl-primary/30"
              }`}
            >
              <Image
                src={getCollectionImage(cat)}
                alt={`${cat} collection`}
                fill
                sizes="220px"
                className="object-cover transition duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vl-ink/90 via-vl-ink/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-vl-heading text-sm font-bold uppercase tracking-wider">{cat}</h3>
                <p className="text-[10px] opacity-75 mt-0.5">Explore lookbook <ArrowRight className="w-3 h-3 inline-block ml-0.5" /></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
