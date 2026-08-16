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
    id: "store-decor-den",
    name: "Decor Den",
    rating: "4.7",
    sales: "1.2K",
    icon: "fa-solid fa-couch",
    bgClass: "bg-gray-100 text-brand-dark",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q",
    alt: "Modern interior"
  },
  {
    id: "store-pooja-house",
    name: "Pooja House",
    rating: "4.6",
    sales: "980",
    icon: "fa-solid fa-om",
    bgClass: "bg-[#fff3e0] text-brand-orange",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3fa4or3W-WSU5sh78HJRsjQi8YuMU1x4OWK_qh5iG6g0urWXsZIzEYZ3z8xL34FVstj6zhQIfhpXSWeTtqCcHyxBcyqeRRxeUrJr99pas7RXWuZ07Nk56YBgV13PsEVVHEolDa5cj5sqKz_YEN5tIs5f70f36nbJ4dYgvGp2LyPYNF9UVUDZxbK-NP5a8Os37CVUxpOs8qQnuT__kwwiXYi93rPA7pb81W44VFzzNhqmD5xU0wrvkSkOCCV-RDeQtWGI",
    alt: "Traditional Indian decor"
  },
  {
    id: "store-ecolife",
    name: "EcoLife",
    rating: "4.6",
    sales: "1.1K",
    icon: "fa-solid fa-spa",
    bgClass: "bg-[#E6F2F2] text-brand-teal",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMumtK8c5fywTtEgpNniKEZj4NJkCkVdEyYga6Rba_p400OXvbITFfZVIVLobUcG_42Q8KvEVV40ICzfRsOT29udrVUQwoAUeqyzodluWHt0NFV3rcfHYPO5C1dUhssAwYlb7tL_uU5Pzv38wBiYjw6ilAYmyNfTqX5yVZfaXEzYy5T0maQmimtgFteMdMeHj3kkgFQyzg-I1FF91tVG61B4j4KVc4LrPLf2AuG064i0n3G32GtJiT0pbvkCYHb-bQuOg",
    alt: "Sustainable home setup"
  },
  {
    id: "store-urban-living",
    name: "Urban Living",
    rating: "4.5",
    sales: "760",
    icon: "fa-solid fa-house-laptop",
    bgClass: "bg-gray-100 text-brand-dark",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuurJXwGdTdz_-0wMxVN2aMmGPGayCppYqHODfGdphCjeVgomeeby6jb8RsVhRvYVR_9cwyJLD-WS7LJoGO6aBxrR9RrRg9IVQbAosyaostEQQ7Zz76DIPAkpyeTePIzrpLbiMdgTbHJfmEcoFi6vgzxY7bxpJoesSOmpSH3cqQ6lZwNYQD4j3fq8hTSupdMZDRkGYjnAH89YApOv9SnGhCvHd21b0N1--B80LxTbxX6Z1qjfKXFe9w",
    alt: "Modern home setup"
  },
  {
    id: "store-beauty-world",
    name: "Beauty World",
    rating: "4.6",
    sales: "890",
    icon: "fa-solid fa-spray-can-sparkles",
    bgClass: "bg-[#fce4ec] text-[#e91e63]",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuurJXwGdTdz_-0wMxVN2aMmGPGayCppYqHODfGdphCjeVgomeeby6jb8RsVhRvYVR_9cwyJLD-WS7LJoGO6aBxrR9RrRg9IVQbAosyaostEQQ7Zz76DIPAkpyeTePIzrpLbiMdgTbHJfmEcoFi6vgzxY7bxpJoesSOmpSH3cqQ6lZwNYQD4j3fq8hTSupdMZDRkGYjnAH89YApOv9SnGhCvHd21b0N1--B80LxTbxX6Z1qjfKXFe9w",
    alt: "Beauty skincare bottles"
  }
];

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const useFallback = sellers.length === 0;

  // We want to show 5 stores to match mock-up exactly
  const displayStores = useFallback
    ? defaultStores
    : sellers.slice(0, 5).map((seller, index) => {
        const cfg = defaultStores[index % defaultStores.length];
        return {
          id: seller.id,
          name: seller.businessName,
          rating: "4.6",
          sales: "1K",
          logoUrl: seller.logoUrl,
          bgClass: cfg.bgClass,
          icon: cfg.icon,
          img: cfg.img,
          alt: seller.businessName
        };
      });

  return (
    <section className="px-4 md:px-0 mb-8 md:mb-12" data-purpose="top-stores">
      {/* Header Info */}
      <div className="flex justify-between items-end mb-6 md:mb-8 font-sans">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-[#222222]">Top Stores For You</h3>
        </div>
        <Link href="/stores" className="text-sm md:text-base font-semibold text-[#0F7F7F] hover:underline">
          View All Stores
        </Link>
      </div>

      {/* Grid — 5-col desktop matching reference screen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 font-sans">
        {displayStores.map((store) => (
          <Link
            key={store.id}
            href={useFallback ? "/stores" : `/sellers/${store.id}`}
            className="bg-[#FFFFFF] border border-[#E5E7E7] rounded-xl p-3 md:p-4 flex flex-col hover:shadow-md transition group cursor-pointer"
          >
            {/* Store Header Info */}
            <div className="flex items-center gap-2 md:gap-3 mb-3">
              {"logoUrl" in store && (store as any).logoUrl ? (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 relative">
                  <Image src={(store as any).logoUrl} alt={store.name} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${store.bgClass} flex items-center justify-center flex-shrink-0 text-sm md:text-base`}>
                  <i className={store.icon}></i>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs md:text-sm font-bold text-[#222222] truncate">{store.name}</h4>
                <div className="flex items-center gap-1 text-[9px] md:text-[10px] text-gray-500 mt-0.5">
                  <span className="text-[#222222] font-semibold">{store.rating}</span>
                  <i className="fa-solid fa-star text-[#F39C12]"></i>
                  <span className="truncate">({store.sales})</span>
                </div>
              </div>
            </div>
            {/* Image Cover */}
            <div className="aspect-[4/3] bg-gray-50 rounded-lg mb-3 overflow-hidden relative">
              {useFallback ? (
                <img
                  src={store.img}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <Image
                  src={store.img}
                  alt={store.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              )}
            </div>
            {/* CTA Follow Button */}
            <button
              type="button"
              suppressHydrationWarning
              className="w-full py-1.5 border border-[#0F7F7F] text-[#0F7F7F] rounded-lg text-xs font-semibold hover:bg-[#0F7F7F] hover:text-white transition mt-auto"
            >
              Follow
            </button>
          </Link>
        ))}
      </div>
    </section>
  );
}
