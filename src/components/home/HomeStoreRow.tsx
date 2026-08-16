"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface SellerData {
  id: string;
  businessName: string;
  category?: string;
  logoUrl?: string | null;
}

interface HomeStoreRowProps {
  sellers: SellerData[];
}

const defaultStores = [
  {
    id: "store-ecolife",
    name: "EcoLife",
    rating: "4.8",
    sales: "1.5K",
    icon: "fa-solid fa-spa",
    bgClass: "bg-[#E6F2F2] text-brand-teal",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMumtK8c5fywTtEgpNniKEZj4NJkCkVdEyYga6Rba_p400OXvbITFfZVIVLobUcG_42Q8KvEVV40ICzfRsOT29udrVUQwoAUeqyzodluWHt0NFV3rcfHYPO5C1dUhssAwYlb7tL_uU5Pzv38wBiYjw6ilAYmyNfTqX5yVZfaXEzYy5T0maQmimtgFteMdMeHj3kkgFQyzg-I1FF91tVG61B4j4KVc4LrPLf2AuG064i0n3G32GtJiT0pbvkCYHb-bQuOg",
    alt: "Sustainable home setup"
  },
  {
    id: "store-pooja-house",
    name: "Pooja House",
    rating: "4.8",
    sales: "1.5K",
    icon: "fa-solid fa-om",
    bgClass: "bg-[#fff3e0] text-brand-orange",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3fa4or3W-WSU5sh78HJRsjQi8YuMU1x4OWK_qh5iG6g0urWXsZIzEYZ3z8xL34FVstj6zhQIfhpXSWeTtqCcHyxBcyqeRRxeUrJr99pas7RXWuZ07Nk56YBgV13PsEVVHEolDa5cj5sqKz_YEN5tIs5f70f36nbJ4dYgvGp2LyPYNF9UVUDZxbK-NP5a8Os37CVUxpOs8qQnuT__kwwiXYi93rPA7pb81W44VFzzNhqmD5xU0wrvkSkOCCV-RDeQtWGI",
    alt: "Traditional Indian decor"
  },
  {
    id: "store-decor-den",
    name: "Decor Den",
    rating: "4.8",
    sales: "1.5K",
    icon: "fa-solid fa-house",
    bgClass: "bg-gray-100 text-brand-dark",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q",
    alt: "Modern interior"
  },
  {
    id: "store-wellness-plus",
    name: "Wellness Plus",
    rating: "4.8",
    sales: "1.5K",
    icon: "fa-solid fa-spa",
    bgClass: "bg-[#E6F2F2] text-brand-teal",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuurJXwGdTdz_-0wMxVN2aMmGPGayCppYqHODfGdphCjeVgomeeby6jb8RsVhRvYVR_9cwyJLD-WS7LJoGO6aBxrR9RrRg9IVQbAosyaostEQQ7Zz76DIPAkpyeTePIzrpLbiMdgTbHJfmEcoFi6vgzxY7bxpJoesSOmpSH3cqQ6lZwNYQD4j3fq8hTSupdMZDRkGYjnAH89YApOv9SnGhCvHd21b0N1--B80LxTbxX6Z1qjfKXFe9w",
    alt: "Serene spa setting"
  }
];

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const useFallback = sellers.length === 0;

  return (
    <section className="px-4 md:px-0 mb-8 md:mb-12" data-purpose="top-stores">
      {/* Header Info */}
      <div className="flex justify-between items-end mb-6 md:mb-8">
        <div>
          <h3 className="text-[20px] md:text-2xl font-bold text-[#222222] font-inter">Best Stores For You</h3>
          <p className="text-[13px] md:text-base text-[#666666] font-inter mt-1">Handpicked sellers delivering exceptional quality</p>
        </div>
        <Link href="/stores" className="text-sm md:text-base font-semibold text-[#0F7F7F] hover:underline font-inter">
          View All Stores →
        </Link>
      </div>

      {/* Grid — 2-col mobile, 4-col desktop matching Stitch screen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {useFallback
          ? defaultStores.map((store) => (
              <Link
                key={store.id}
                href="/stores"
                className="bg-[#FFFFFF] border border-[#E5E7E7] rounded-[12px] p-[16px] flex flex-col hover:shadow-md transition group cursor-pointer"
              >
                {/* Store Header Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${store.bgClass} flex items-center justify-center flex-shrink-0`}>
                    <i className={store.icon}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#222222] line-clamp-1">{store.name}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                      <span className="text-[#222222] font-medium">{store.rating}</span>
                      <i className="fa-solid fa-star text-[#F39C12]"></i>
                      <span className="truncate">| {store.sales}</span>
                    </div>
                  </div>
                </div>
                {/* Image Cover */}
                <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                  <img
                    src={store.img}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* CTA Button */}
                <button
                  suppressHydrationWarning
                  className="w-full py-2 border border-[#0F7F7F] text-[#0F7F7F] rounded-lg text-xs font-semibold hover:bg-[#0F7F7F] hover:text-white transition mt-auto"
                >
                  Visit Store
                </button>
              </Link>
            ))
          : sellers.slice(0, 4).map((seller) => {
              const cfg = defaultStores.find((s) => s.id === `store-${seller.id}`) || defaultStores[0];
              return (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className="bg-[#FFFFFF] border border-[#E5E7E7] rounded-[12px] p-[16px] flex flex-col hover:shadow-md transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {seller.logoUrl ? (
                      <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 relative">
                        <Image src={seller.logoUrl} alt={seller.businessName} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${cfg.bgClass} flex items-center justify-center flex-shrink-0`}>
                        <i className={cfg.icon}></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#222222] line-clamp-1">{seller.businessName}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                        <span className="text-[#222222] font-medium">4.8</span>
                        <i className="fa-solid fa-star text-[#F39C12]"></i>
                        <span>| 1.2K</span>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                    <Image
                      src={cfg.img}
                      alt={seller.businessName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <button
                    suppressHydrationWarning
                    className="w-full py-2 border border-[#0F7F7F] text-[#0F7F7F] rounded-lg text-xs font-semibold hover:bg-[#0F7F7F] hover:text-white transition mt-auto"
                  >
                    Visit Store
                  </button>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
