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

// Icon colors by category
const categoryConfig: Record<string, { icon: string; bg: string; color: string }> = {
  "home-decor": { icon: "fa-solid fa-house", bg: "bg-gray-100", color: "text-[#0d3b36]" },
  spiritual: { icon: "fa-solid fa-om", bg: "bg-orange-50", color: "text-orange-600" },
  wellness: { icon: "fa-solid fa-spa", bg: "bg-[#E6F2F2]", color: "text-[#0F7F7F]" },
  kitchen: { icon: "fa-solid fa-utensils", bg: "bg-yellow-50", color: "text-yellow-600" },
  beauty: { icon: "fa-solid fa-pump-soap", bg: "bg-pink-50", color: "text-pink-500" },
  electronics: { icon: "fa-solid fa-mobile-screen", bg: "bg-blue-50", color: "text-blue-600" },
  default: { icon: "fa-solid fa-store", bg: "bg-[#E6F2F2]", color: "text-[#0F7F7F]" },
};

const fallbackStores = [
  { id: "s1", businessName: "EcoLife", category: "wellness", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMumtK8c5fywTtEgpNniKEZj4NJkCkVdEyYga6Rba_p400OXvbITFfZVIVLobUcG_42Q8KvEVV40ICzfRsOT29udrVUQwoAUeqyzodluWHt0NFV3rcfHYPO5C1dUhssAwYlb7tL_uU5Pzv38wBiYjw6ilAYmyNfTqX5yVZfaXEzYy5T0maQmimtgFteMdMeHj3kkgFQyzg-I1FF91tVG61B4j4KVc4LrPLf2AuG064i0n3G32GtJiT0pbvkCYHb-bQuOg", rating: "4.8", sales: "1.5K" },
  { id: "s2", businessName: "Pooja House", category: "spiritual", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3fa4or3W-WSU5sh78HJRsjQi8YuMU1x4OWK_qh5iG6g0urWXsZIzEYZ3z8xL34FVstj6zhQIfhpXSWeTtqCcHyxBcyqeRRxeUrJr99pas7RXWuZ07Nk56YBgV13PsEVVHEolDa5cj5sqKz_YEN5tIs5f70f36nbJ4dYgvGp2LyPYNF9UVUDZxbK-NP5a8Os37CVUxpOs8qQnuT__kwwiXYi93rPA7pb81W44VFzzNhqmD5xU0wrvkSkOCCV-RDeQtWGI", rating: "4.6", sales: "980" },
  { id: "s3", businessName: "Decor Den", category: "home-decor", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuACQdixwWAIGKztY8FZrDgVQ0PrKq-RjVpAgMgJ030WgqgBvwxAbRnCL8r9ctCBPCLHgEx__LTe2Qdpv3exiAffT7uhOxZImBf-duF8fJXIKqZFxH3Xja0CCqwlKNSghSyyiPc_QFDNEnvGLX9E5TfdYBD3bRYGs3SYb_k0PK6ORE9H_nBoGQv_O37RQ2FFaA2o696xUL7lwT5UEdSQQb2Dvu6Op0NUul8MSuX1aSps2FCp8Yr0VKXZ0Q", rating: "4.7", sales: "1.2K" },
  { id: "s4", businessName: "Wellness Plus", category: "wellness", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYuurJXwGdTdz_-0wMxVN2aMmGPGayCppYqHODfGdphCjeVgomeeby6jb8RsVhRvYVR_9cwyJLD-WS7LJoGO6aBxrR9RrRg9IVQbAosyaostEQQ7Zz76DIPAkpyeTePIzrpLbiMdgTbHJfmEcoFi6vgzxY7bxpJoesSOmpSH3cqQ6lZwNYQD4j3fq8hTSupdMZDRkGYjnAH89YApOv9SnGhCvHd21b0N1--B80LxTbxX6Z1qjfKXFe9w", rating: "4.8", sales: "1.5K" },
  { id: "s5", businessName: "Urban Living", category: "home-decor", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMumtK8c5fywTtEgpNniKEZj4NJkCkVdEyYga6Rba_p400OXvbITFfZVIVLobUcG_42Q8KvEVV40ICzfRsOT29udrVUQwoAUeqyzodluWHt0NFV3rcfHYPO5C1dUhssAwYlb7tL_uU5Pzv38wBiYjw6ilAYmyNfTqX5yVZfaXEzYy5T0maQmimtgFteMdMeHj3kkgFQyzg-I1FF91tVG61B4j4KVc4LrPLf2AuG064i0n3G32GtJiT0pbvkCYHb-bQuOg", rating: "4.7", sales: "1.2K" },
];

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const useFallback = sellers.length === 0;

  return (
    <section className="px-4 md:px-6 mb-8 md:mb-12" data-purpose="top-stores">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div>
            <h3 className="text-[20px] md:text-2xl font-bold text-gray-900">Best Stores For You</h3>
            <p className="text-[13px] md:text-base text-[#666666] mt-1">Handpicked sellers delivering exceptional quality</p>
          </div>
          <Link href="/stores" className="text-sm md:text-base font-semibold text-[#0F7F7F] hover:underline">
            View All Stores →
          </Link>
        </div>

        {/* Grid: 2-col mobile / 3-col tablet / 5-col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {useFallback
            ? fallbackStores.map((store) => {
                const cfg = categoryConfig[store.category] || categoryConfig.default;
                return (
                  <Link
                    key={store.id}
                    href="/stores"
                    className="bg-white border border-[#E5E7E7] rounded-[12px] p-4 flex flex-col hover:shadow-md transition-shadow group"
                  >
                    {/* Logo + name + rating */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center ${cfg.color} flex-shrink-0`}>
                        <i className={cfg.icon}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{store.businessName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          <span className="text-gray-800 font-medium">{store.rating}</span>
                          <i className="fa-solid fa-star text-[#F39C12]"></i>
                          <span>| {store.sales}</span>
                        </div>
                      </div>
                    </div>
                    {/* Cover image */}
                    <div className="h-32 md:h-40 w-full bg-gray-50 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={store.img}
                        alt={store.businessName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* CTA */}
                    <button className="w-full py-2 border border-[#0F7F7F] text-[#0F7F7F] rounded-lg text-xs font-semibold hover:bg-[#0F7F7F] hover:text-white transition-colors mt-auto" suppressHydrationWarning>
                      Visit Store
                    </button>
                  </Link>
                );
              })
            : sellers.slice(0, 5).map((seller) => {
                const cat = (seller.category || "default").toLowerCase().replace(/\s+/g, "-");
                const cfg = categoryConfig[cat] || categoryConfig.default;
                return (
                  <Link
                    key={seller.id}
                    href={`/sellers/${seller.id}`}
                    className="bg-white border border-[#E5E7E7] rounded-[12px] p-4 flex flex-col hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {seller.logoUrl ? (
                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 relative">
                          <Image src={seller.logoUrl} alt={seller.businessName} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center ${cfg.color} flex-shrink-0`}>
                          <i className={cfg.icon}></i>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{seller.businessName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          <span className="text-gray-800 font-medium">4.7</span>
                          <i className="fa-solid fa-star text-[#F39C12]"></i>
                          <span>| 1.2K</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-32 md:h-40 w-full bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                      <Image
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMumtK8c5fywTtEgpNniKEZj4NJkCkVdEyYga6Rba_p400OXvbITFfZVIVLobUcG_42Q8KvEVV40ICzfRsOT29udrVUQwoAUeqyzodluWHt0NFV3rcfHYPO5C1dUhssAwYlb7tL_uU5Pzv38wBiYjw6ilAYmyNfTqX5yVZfaXEzYy5T0maQmimtgFteMdMeHj3kkgFQyzg-I1FF91tVG61B4j4KVc4LrPLf2AuG064i0n3G32GtJiT0pbvkCYHb-bQuOg"
                        alt={seller.businessName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    </div>
                    <button className="w-full py-2 border border-[#0F7F7F] text-[#0F7F7F] rounded-lg text-xs font-semibold hover:bg-[#0F7F7F] hover:text-white transition-colors mt-auto" suppressHydrationWarning>
                      Visit Store
                    </button>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
