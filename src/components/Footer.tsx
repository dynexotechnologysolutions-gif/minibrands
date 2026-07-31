"use client";

import { ArrowUpRight, BadgeCheck, Camera, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/seller");
  if (isDashboard) return null;

  const isCheckout = pathname === "/checkout";
  if (isCheckout) {
    return (
      <footer className="w-full border-t border-vl-border bg-vl-card" role="contentinfo">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <div><Link href="/" className="font-vl-heading text-base font-extrabold tracking-[-0.03em] text-vl-ink">MiniBrands</Link><p className="mt-1 text-xs text-vl-muted">Secure, escrow-protected checkout</p></div>
          <div className="flex items-center gap-4 text-xs text-vl-muted"><Link href="/privacy" className="transition hover:text-vl-primary">Privacy</Link><Link href="/terms" className="transition hover:text-vl-primary">Terms</Link><Link href="/returns-policy" className="transition hover:text-vl-primary">Returns</Link></div>
          <p className="text-xs text-vl-muted">© {new Date().getFullYear()} MiniBrands</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-20 w-full border-t border-vl-border bg-vl-card" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-vl-heading text-2xl font-extrabold tracking-[-0.05em] text-vl-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-vl-primary text-base text-white">M</span>MiniBrands</Link>
            <p className="mt-4 max-w-[420px] text-[16px] leading-[1.7] text-slate-400">A fashion marketplace for independent labels, expressive wardrobes, and pieces with a point of view.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-vl-muted"><BadgeCheck aria-hidden="true" className="h-4 w-4 text-vl-success" />Verified labels, thoughtfully shipped</div>
          </div>
          <div><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">Shop</h2><ul className="mt-4 space-y-3 text-sm text-vl-muted"><li><Link href="/products" className="transition hover:text-vl-primary">Browse everything</Link></li><li><Link href="/products?category=western" className="transition hover:text-vl-primary">Western edit</Link></li><li><Link href="/products?category=ethnic" className="transition hover:text-vl-primary">Ethnic edit</Link></li><li><Link href="/products?category=accessories" className="transition hover:text-vl-primary">Accessories</Link></li></ul></div>
          <div><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">MiniBrands</h2><ul className="mt-4 space-y-3 text-sm text-vl-muted"><li><Link href="/about" className="transition hover:text-vl-primary">Our story</Link></li><li><Link href="/about#careers" className="transition hover:text-vl-primary">Careers</Link></li><li><Link href="/about#blog" className="transition hover:text-vl-primary">Journal</Link></li><li><Link href="/login?role=seller" className="transition hover:text-vl-primary">Become a seller</Link></li></ul></div>
          <div><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">Support</h2><ul className="mt-4 space-y-3 text-sm text-vl-muted"><li><Link href="/contact" className="transition hover:text-vl-primary">Contact us</Link></li><li><Link href="/faqs" className="transition hover:text-vl-primary">Help & FAQs</Link></li><li><Link href="/returns-policy" className="transition hover:text-vl-primary">Returns & refunds</Link></li><li><Link href="/privacy" className="transition hover:text-vl-primary">Privacy policy</Link></li></ul></div>
        </div>
        <div className="mt-12 flex flex-col gap-5 border-t border-vl-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-vl-muted">© {new Date().getFullYear()} MiniBrands India. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-vl-muted"><span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-vl-success" /> Secure checkout</span><span className="inline-flex items-center gap-1.5"><Sparkles aria-hidden="true" className="h-4 w-4 text-vl-accent" /> Curated independent labels</span><Link href="https://instagram.com" aria-label="MiniBrands on Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-vl-border transition hover:border-vl-primary hover:text-vl-primary"><Camera aria-hidden="true" className="h-4 w-4" /></Link><ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 sm:block" /></div>
        </div>
      </div>
    </footer>
  );
}
