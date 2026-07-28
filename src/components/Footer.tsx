"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const pathname = usePathname();
  
  // Exclude dashboard layout groups from showing global footer
  const isDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/seller");
  if (isDashboard) return null;

  const isCheckout = pathname === "/checkout";

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        
        {/* If checkout flow, display minimal trust-centric footer only */}
        {isCheckout ? (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-lg font-extrabold tracking-wider text-white">MINIBRANDS</span>
              <p className="text-xs text-slate-500 mt-1">Escrow-Protected Checkout</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-slate-700">|</span>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-slate-700">|</span>
              <Link href="/returns-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
            
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} MiniBrands. All rights reserved.
            </div>
          </div>
        ) : (
          /* Main full-scale footer */
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              
              {/* Brand and Description */}
              <div className="col-span-2 md:col-span-1">
                <span className="text-xl font-extrabold tracking-wider text-white">MINIBRANDS</span>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Chennai's forward-looking fashion marketplace. Shop curated premium styles from verified independent designers.
                </p>
              </div>

              {/* Shop Links */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase mb-4">Shop</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/catalog" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Browse Catalog
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalog?category=ethnic" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Ethnic Wear
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalog?category=streetwear" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Streetwear
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company Info */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase mb-4">Company</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/about" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Our Story
                    </Link>
                  </li>
                  <li>
                    <Link href="/about#careers" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/about#blog" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support & Legal */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase mb-4">Support & Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/contact" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/faqs" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Help Center & FAQs
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns-policy" className="text-slate-400 hover:text-white transition-colors focus:ring-2 focus:ring-indigo-500 rounded p-1">
                      Returns & Refunds
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Section */}
            <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Copyright */}
              <p className="text-xs text-slate-500 order-2 sm:order-1">
                © {new Date().getFullYear()} MiniBrands Velvet Lane India. All rights reserved.
              </p>
              
              {/* Security & Verification Badges */}
              <div className="flex items-center gap-3 order-1 sm:order-2">
                <span className="text-slate-600 text-xs uppercase tracking-wide">Secured By</span>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 font-extrabold text-[10px] rounded tracking-widest uppercase">Razorpay</span>
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 font-extrabold text-[10px] rounded tracking-widest uppercase">UPI</span>
                  <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-emerald-500 font-bold text-[10px] rounded tracking-wide uppercase">Escrow Secure</span>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </footer>
  );
}
