"use client";

import React, { useState } from "react";
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

export default function HomeStoreRow({ sellers }: HomeStoreRowProps) {
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowingState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const defaultStores = [
    {
      id: "store-decor-den",
      name: "Decor Den",
      rating: "4.7 (1.2K)",
      logoText: "DECOR\nDEN",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc2cgI-o7c8nZ6sqtYIg1jSLUlPa7HchF619w19lZpLPQWgbGasg0hIL7wtv2T7W-1l2BPGXiyvN9-1PoBokb0N5uoW1-H5EBght96xOfztzBSuz1ecdJflcidmaZJImTyDXFMtrjR6tJs7mgNjI8PWAMVaBPrwzWzVSDGlaVfUt-e_oO4-StFSafrui5MgLWac8M7ifNjJ4ib_xZ_mBjmkUN4IUs31Z9he6IYjP0KcxO21W5zado5_w",
    },
    {
      id: "store-pooja-house",
      name: "Pooja House",
      rating: "4.6 (980)",
      icon: "fa-solid fa-om text-orange-600 text-xl md:text-2xl",
      bgClass: "bg-orange-50 border-orange-100",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3yybzhxvle1aJOB7P0X9aCkfsSZn96L8SZ2l-YaKYOc04mqkS419p-WGNxGfsNthHAdKATUb2F7HpYj9FxuJnPPT8Y6y83DsYKr9t85GH4DfMjfesrhSNM7-faktwah3ay67tFMwtZcXipUj_yP3U67RMm3tcd-ZJYN2a2mTfb8pmBk4vuK3qTLT61xwejNUPNNUnneedSMKbamd3EdsQ7DL0itW3pHSPm_LH9bkXEKYVV5jeDlckOA",
    },
    {
      id: "store-ecolife",
      name: "EcoLife",
      rating: "4.6 (1.1K)",
      icon: "fa-solid fa-leaf text-green-600 text-xl md:text-2xl",
      bgClass: "bg-green-50 border-green-100",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAk1OOwBZBI1mHOcLSGAr99JbnCUWDTEMrukyq1ygQWjWgxPTFLHTgOURTPS5ij5FkL4reLJlOt5EdFAh5n8vjBBenPQHQt06CxUFFJrL9E2lojuC0gT3vljSnznny7hr72epr7aeRMKGQ-l-Huklfnl8i4LplqytZiSn85LHJtRV_Z3YyX4-PAK_zV4duBMkhydcsZNLeE0_CNXV06JUzw-TqYhHhNKeGenyDQd4h9u__ohqaJa4gmEA",
    },
  ];

  return (
    <section className="mb-6 md:mb-12" data-purpose="top-stores">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end px-4 md:px-8 mb-4 md:mb-6">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900">Top Stores For You</h3>
          <Link href="/stores" className="text-xs md:text-sm text-gray-600 font-medium hover:underline text-[#004F50]">
            View All Stores
          </Link>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 md:px-8 pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible">
          {sellers.length > 0
            ? sellers.slice(0, 5).map((seller) => {
                const isFollowing = !!followingState[seller.id];
                return (
                  <Link
                    key={seller.id}
                    href={`/sellers/${seller.id}`}
                    className="w-[160px] shrink-0 md:w-auto md:shrink-1 bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col p-3 md:p-4"
                  >
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden text-[8px] md:text-[10px] font-bold text-center leading-none flex-shrink-0 text-[#004F50]">
                        {seller.logoUrl ? (
                          <Image src={seller.logoUrl} alt={seller.businessName} fill sizes="48px" className="object-cover" />
                        ) : (
                          seller.businessName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm md:text-base font-bold leading-tight text-gray-800 truncate">
                          {seller.businessName}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 mt-0.5">
                          <i className="fa-solid fa-star text-orange-400"></i>
                          <span className="font-medium">4.7 (1.2K)</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-28 md:h-36 bg-gray-200 rounded-lg mb-3 md:mb-4 overflow-hidden relative">
                      <Image
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc2cgI-o7c8nZ6sqtYIg1jSLUlPa7HchF619w19lZpLPQWgbGasg0hIL7wtv2T7W-1l2BPGXiyvN9-1PoBokb0N5uoW1-H5EBght96xOfztzBSuz1ecdJflcidmaZJImTyDXFMtrjR6tJs7mgNjI8PWAMVaBPrwzWzVSDGlaVfUt-e_oO4-StFSafrui5MgLWac8M7ifNjJ4ib_xZ_mBjmkUN4IUs31Z9he6IYjP0KcxO21W5zado5_w"
                        alt={seller.businessName}
                        fill
                        sizes="200px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleFollow(seller.id, e)}
                      className={`w-full py-2 md:py-2.5 border border-[#004F50] transition-colors rounded-lg text-sm md:text-base font-semibold mt-auto ${
                        isFollowing
                          ? "bg-[#004F50] text-white"
                          : "text-[#004F50] hover:bg-[#004F50] hover:text-white"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </Link>
                );
              })
            : defaultStores.map((store) => {
                const isFollowing = !!followingState[store.id];
                return (
                  <div
                    key={store.id}
                    className="w-[160px] shrink-0 md:w-auto md:shrink-1 bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col p-3 md:p-4"
                  >
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border overflow-hidden text-[8px] md:text-[10px] font-bold text-center leading-none flex-shrink-0 ${
                          store.bgClass || "bg-gray-100 border-gray-200"
                        }`}
                      >
                        {store.icon ? <i className={store.icon}></i> : store.logoText}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm md:text-base font-bold leading-tight text-gray-800">{store.name}</p>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 mt-0.5">
                          <i className="fa-solid fa-star text-orange-400"></i>
                          <span className="font-medium">{store.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-28 md:h-36 bg-gray-200 rounded-lg mb-3 md:mb-4 overflow-hidden relative">
                      <img
                        alt={store.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        src={store.img}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleFollow(store.id, e)}
                      className={`w-full py-2 md:py-2.5 border border-[#004F50] transition-colors rounded-lg text-sm md:text-base font-semibold mt-auto ${
                        isFollowing
                          ? "bg-[#004F50] text-white"
                          : "text-[#004F50] hover:bg-[#004F50] hover:text-white"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
