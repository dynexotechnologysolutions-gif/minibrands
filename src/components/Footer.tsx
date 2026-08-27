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
          <div className="flex items-center gap-4 text-xs text-vl-muted">
            <Link href="/privacy" className="transition-all duration-vl-fast hover:text-vl-primary">Privacy</Link>
            <Link href="/terms" className="transition-all duration-vl-fast hover:text-vl-primary">Terms</Link>
            <Link href="/returns-policy" className="transition-all duration-vl-fast hover:text-vl-primary">Returns</Link>
          </div>
          <p className="text-xs text-vl-muted">© {new Date().getFullYear()} MiniBrands</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-20 w-full border-t border-vl-border bg-vl-card" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-vl-heading text-2xl font-extrabold tracking-[-0.05em] text-vl-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-vl-primary text-base text-white">M</span>MiniBrands</Link>
            <p className="mt-4 max-w-[420px] text-[16px] leading-[1.7] text-slate-400">A fashion marketplace for independent labels, expressive wardrobes, and pieces with a point of view.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-vl-muted"><BadgeCheck aria-hidden="true" className="h-4 w-4 text-vl-success" />Verified labels, thoughtfully shipped</div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">Shop</h2>
            <ul className="mt-4 space-y-3 text-sm text-vl-muted">
              <li><Link href="/products" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Browse everything</Link></li>
              <li><Link href="/products?category=western" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Western edit</Link></li>
              <li><Link href="/products?category=ethnic" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Ethnic edit</Link></li>
              <li><Link href="/products?category=accessories" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Accessories</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">MiniBrands</h2>
            <ul className="mt-4 space-y-3 text-sm text-vl-muted">
              <li><Link href="/about" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Our story</Link></li>
              <li><Link href="/about#careers" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Careers</Link></li>
              <li><Link href="/about#blog" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Journal</Link></li>
              <li><Link href="/login?role=seller" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Become a seller</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">Support</h2>
            <ul className="mt-4 space-y-3 text-sm text-vl-muted">
              <li><Link href="/contact" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Contact us</Link></li>
              <li><Link href="/faqs" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Help & FAQs</Link></li>
              <li><Link href="/returns-policy" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Returns & refunds</Link></li>
              <li><Link href="/privacy" className="transform transition-all duration-vl-fast hover:translate-x-0.5 hover:text-vl-primary inline-block">Privacy policy</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-vl-ink">The Weekly Edit</h2>
            <p className="mt-4 text-xs text-vl-muted leading-relaxed">
              Subscribe to get updates on new arrivals, special offers, and curated designer spotlight drops.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-2">
              <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="Enter email address"
                className="w-full rounded-xl border border-vl-border bg-white px-3 py-2 text-xs text-vl-ink outline-none transition duration-vl-fast focus:border-vl-primary"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-vl-primary py-2 text-xs font-semibold text-white transition duration-vl-fast hover:bg-vl-primary-strong cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-5 border-t border-vl-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-vl-muted">© {new Date().getFullYear()} MiniBrands India. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-vl-muted">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-vl-success" /> Secure checkout</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles aria-hidden="true" className="h-4 w-4 text-vl-accent" /> Curated independent labels</span>
            <Link href="https://instagram.com" aria-label="MiniBrands on Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-vl-border transition hover:border-vl-primary hover:text-vl-primary"><Camera aria-hidden="true" className="h-4 w-4" /></Link>
            <ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
          </div>
        </div>
      </div>
    </footer>
  );
}
