import React from "react";
import Link from "next/link";

const budgetTiers = [
  {
    label: "Under ₹499",
    desc: "Everyday Essentials",
    href: "/products?maxPrice=499",
    chipClass: "bg-[#E6F2F2] text-[#0F7F7F] group-hover:bg-[#0F7F7F] group-hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Under ₹999",
    desc: "Home & Lifestyle Upgrades",
    href: "/products?maxPrice=999",
    chipClass: "bg-[#E6F2F2] text-[#0F7F7F] group-hover:bg-[#0F7F7F] group-hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Under ₹1,499",
    desc: "Premium Handcrafted Items",
    href: "/products?maxPrice=1499",
    chipClass: "bg-[#E6F2F2] text-[#0F7F7F] group-hover:bg-[#0F7F7F] group-hover:text-white",
    linkColor: "text-[#0F7F7F]",
  },
  {
    label: "Flat 50% Off",
    desc: "Clearance Deals",
    href: "/products?discount=50",
    chipClass: "bg-[#fff3e0] text-[#F39C12] group-hover:bg-[#F39C12] group-hover:text-white",
    linkColor: "text-[#F39C12]",
  },
];

export default function HomeShopByBudget() {
  return (
    <section className="px-4 md:px-0 mb-8 md:mb-12" data-purpose="shop-by-budget">
      {/* Header Info */}
      <div className="mb-6 md:mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[20px] md:text-2xl font-bold text-[#222222] font-inter">Shop by Budget</h3>
          <p className="text-[13px] md:text-base text-[#666666] font-inter mt-1">Quality products tailored to your spend</p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {budgetTiers.map((tier) => (
          <Link
            key={tier.label}
            href={tier.href}
            className="bg-[#FFFFFF] border border-[#E5E7E7] rounded-[12px] p-[16px] md:p-6 flex flex-col hover:shadow-md transition group cursor-pointer"
          >
            {/* Budget Chip */}
            <span
              className={`inline-block text-sm md:text-base font-semibold px-3 py-1.5 rounded-lg mb-3 self-start transition-colors duration-250 ${tier.chipClass}`}
            >
              {tier.label}
            </span>
            {/* Description */}
            <p className="text-[13px] md:text-base text-[#666666] mb-6 font-inter flex-grow">{tier.desc}</p>
            {/* Link row */}
            <span className={`${tier.linkColor} text-sm md:text-base font-semibold mt-auto font-inter flex items-center gap-2 group-hover:gap-3 transition-all duration-200`}>
              Browse Tier <i className="fa-solid fa-arrow-right"></i>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
