import React from "react";
import Link from "next/link";

const budgetTiers = [
  {
    label: "Under ₹499",
    desc: "Everyday Essentials",
    href: "/products?maxPrice=499",
    chipBg: "bg-[#E6F2F2]",
    chipText: "text-[#0F7F7F]",
    hoverBg: "hover:bg-[#0F7F7F]",
    hoverText: "hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Under ₹999",
    desc: "Home & Lifestyle Upgrades",
    href: "/products?maxPrice=999",
    chipBg: "bg-[#E6F2F2]",
    chipText: "text-[#0F7F7F]",
    hoverBg: "hover:bg-[#0F7F7F]",
    hoverText: "hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Under ₹1,499",
    desc: "Premium Handcrafted Items",
    href: "/products?maxPrice=1499",
    chipBg: "bg-[#E6F2F2]",
    chipText: "text-[#0F7F7F]",
    hoverBg: "hover:bg-[#0F7F7F]",
    hoverText: "hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Flat 50% Off",
    desc: "Clearance Deals",
    href: "/products?discount=50",
    chipBg: "bg-orange-50",
    chipText: "text-[#F39C12]",
    hoverBg: "hover:bg-[#F39C12]",
    hoverText: "hover:text-white",
    linkColor: "text-[#F39C12]",
  },
];

export default function HomeShopByBudget() {
  return (
    <section className="px-4 md:px-6 mb-8 md:mb-12" data-purpose="shop-by-budget">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex justify-between items-end">
          <div>
            <h3 className="text-[20px] md:text-2xl font-bold text-gray-900">Shop by Budget</h3>
            <p className="text-[13px] md:text-base text-[#666666] mt-1">Quality products tailored to your spend</p>
          </div>
        </div>

        {/* 4-tile grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {budgetTiers.map((tier) => (
            <Link
              key={tier.label}
              href={tier.href}
              className="bg-white border border-[#E5E7E7] rounded-[12px] p-4 md:p-6 flex flex-col hover:shadow-md transition-shadow group cursor-pointer"
            >
              {/* Budget chip */}
              <span
                className={`inline-block ${tier.chipBg} ${tier.chipText} text-sm md:text-base font-semibold px-3 py-1.5 rounded-lg mb-3 self-start ${tier.hoverBg} ${tier.hoverText} transition-colors`}
              >
                {tier.label}
              </span>
              {/* Description */}
              <p className="text-[13px] md:text-base text-[#666666] mb-6 flex-grow">{tier.desc}</p>
              {/* CTA link */}
              <span className={`${tier.linkColor} text-sm md:text-base font-semibold mt-auto flex items-center gap-2 group-hover:gap-3 transition-all`}>
                Browse Tier <i className="fa-solid fa-arrow-right"></i>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
