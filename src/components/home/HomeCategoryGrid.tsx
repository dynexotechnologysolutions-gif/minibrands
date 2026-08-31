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
    iconClass: "fa-solid fa-gamepad text-slate-700",
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
    <section className="w-full bg-white border-b border-gray-100 py-1 md:py-1.5" data-purpose="categories-nav">
      {/* Horizontally scrolling list of category icons */}
      <div className="flex overflow-x-auto md:overflow-x-visible gap-5 md:gap-9 justify-start md:justify-center py-1 hide-scrollbar snap-x scroll-px-5 px-5 max-w-[1280px] mx-auto font-sans">
        {categories.map((category) => (
          <Link
            key={category.label}
            href={category.href}
            className="flex flex-col items-center group flex-shrink-0 snap-start cursor-pointer"
            aria-label={`View ${category.label} products`}
          >
            <div className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <i className={`${category.iconClass.replace("text-slate-700", "text-[#0F7F7F]")} text-sm md:text-base transition-colors duration-150`}></i>
            </div>
            <span className="text-[8px] md:text-[10px] font-semibold text-slate-700 mt-0.5 text-center leading-tight max-w-[3.25rem] group-hover:text-[#0F7F7F] transition-colors duration-150 select-none">
              {category.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
