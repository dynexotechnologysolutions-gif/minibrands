import Link from "next/link";
import { CookingPot, Flower2, Gift, GlassWater, HeartPulse, Shirt, Sofa, Sparkles, type LucideIcon } from "lucide-react";

interface BrowseCategory {
  label: string;
  href: string;
  icon: LucideIcon;
}

const browseCategories: BrowseCategory[] = [
  { label: "Home Decor", href: "/products?category=home-decor", icon: Sofa },
  { label: "Kitchen", href: "/products?category=kitchen", icon: CookingPot },
  { label: "Spiritual", href: "/products?category=spiritual", icon: Flower2 },
  { label: "Bottles", href: "/products?category=bottles", icon: GlassWater },
  { label: "Beauty", href: "/products?category=beauty", icon: Sparkles },
  { label: "Wellness", href: "/products?category=heart-pulse", icon: HeartPulse },
  { label: "Fashion", href: "/products?category=fashion", icon: Shirt },
  { label: "Gifts", href: "/products?category=gifts", icon: Gift },
];

export default function CategoryBrowseGrid() {
  return (
    <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
      {browseCategories.map((category) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.label}
            href={category.href}
            className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-vl-card border border-vl-border bg-vl-card px-2 py-3 text-center transition duration-vl-fast hover:border-vl-primary hover:bg-white hover:shadow-vl-soft active:scale-[0.97]"
          >
            <Icon aria-hidden="true" className="h-5 w-5 text-vl-primary" />
            <span className="text-[11px] font-semibold leading-tight text-vl-ink">
              {category.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}