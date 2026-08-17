import Link from "next/link";

const categories = [
  {
    label: "Home Decor",
    href: "/products?category=home-decor",
    iconClass: "fa-solid fa-couch text-slate-700",
  },
  {
    label: "Kitchen",
    href: "/products?category=kitchen",
    iconClass: "fa-solid fa-kitchen-set text-slate-700",
  },
  {
    label: "Spiritual",
    href: "/products?category=spiritual",
    iconClass: "fa-solid fa-om text-slate-700",
  },
  {
    label: "Bottles",
    href: "/products?category=bottles",
    iconClass: "fa-solid fa-bottle-water text-slate-700",
  },
  {
    label: "Beauty",
    href: "/products?category=beauty",
    iconClass: "fa-solid fa-spray-can-sparkles text-slate-700",
  },
  {
    label: "Wellness",
    href: "/products?category=heart-pulse",
    iconClass: "fa-solid fa-notes-medical text-slate-700",
  },
  {
    label: "Toys",
    href: "/products?category=toys",
    iconClass: "fa-solid fa-teddy-bear text-slate-700",
  },
  {
    label: "Electronics",
    href: "/products?category=electronics",
    iconClass: "fa-solid fa-laptop text-slate-700",
  },
  {
    label: "More",
    href: "/products",
    iconClass: "fa-solid fa-ellipsis text-slate-700",
  },
];

export default function HomeCategoryGrid() {
  return (
    <section className="w-full bg-white border-b border-gray-100 py-3 md:py-6" data-purpose="categories-nav">
      {/* Header Info — Desktop Only */}
      <div className="hidden md:flex max-w-[1280px] mx-auto items-end justify-between gap-4 px-4 md:px-8 mb-6 font-sans">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">Start here</p>
          <h2 className="font-vl-heading text-3xl font-bold tracking-[-0.04em] text-[#222222]">Shop your mood</h2>
        </div>
        <Link href="/products" className="rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-muted transition hover:bg-vl-card hover:text-vl-primary">View all</Link>
      </div>
      
      {/* Horizontally scrolling list of circular icon cards */}
      <div className="flex overflow-x-auto gap-4 md:gap-8 justify-start md:justify-center py-1 hide-scrollbar snap-x px-4 max-w-[1280px] mx-auto font-sans">
        {categories.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="flex flex-col items-center group flex-shrink-0 snap-start cursor-pointer"
            aria-label={`View ${category.label} products`}
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border border-[#E5E7E7] flex items-center justify-center shadow-sm group-hover:bg-[#0F7F7F] group-hover:border-[#0F7F7F] transition-all duration-200 ease-out">
              <i className={`${category.iconClass} text-base md:text-xl group-hover:text-white transition-colors duration-150`}></i>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-700 mt-2 text-center group-hover:text-[#0F7F7F] transition-colors duration-150 select-none">
              {category.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
