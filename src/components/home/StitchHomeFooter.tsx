"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function StitchHomeFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="hidden md:block bg-[#303030] text-[#F3F0EF] w-full py-10 px-4 md:px-6">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="flex flex-col gap-2">
          <span className="font-bold text-2xl text-[#97F2F1] mb-1">Velvet Lane</span>
          <p className="text-sm text-white/80">Many Stores. One Trusted Place.</p>
        </div>

        {/* Company Links */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-base text-white mb-1">Company</h4>
          <Link href="/about" className="text-sm text-white/80 hover:text-white transition-colors">About Us</Link>
          <Link href="/careers" className="text-sm text-white/80 hover:text-white transition-colors">Careers</Link>
          <Link href="/press" className="text-sm text-white/80 hover:text-white transition-colors">Press</Link>
        </div>

        {/* Help & Policies */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-base text-white mb-1">Help &amp; Policies</h4>
          <Link href="/shipping" className="text-sm text-white/80 hover:text-white transition-colors">Shipping Policy</Link>
          <Link href="/terms" className="text-sm text-white/80 hover:text-white transition-colors">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="text-sm text-white/80 hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/returns" className="text-sm text-white/80 hover:text-white transition-colors">Returns &amp; Refunds</Link>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-base text-white mb-1">Newsletter</h4>
          <p className="text-sm text-white/80 mb-2">Subscribe to get update and offers.</p>
          <form onSubmit={handleSubscribe} className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 rounded-l bg-white text-[#1B1C1C] text-sm focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-[#F39C12] text-white px-4 rounded-r text-xs font-semibold hover:bg-[#D68910] transition-colors shrink-0"
            >
              {subscribed ? "Subscribed!" : "Subscribe"}
            </button>
          </form>
        </div>

        {/* Bottom Copyright Row */}
        <div className="col-span-1 md:col-span-4 mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/60">
          <p>© 2026 Velvet Lane Marketplace. All Rights Reserved.</p>
          <div className="flex gap-2">
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-bold text-[9px] text-white">VISA</div>
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-bold text-[9px] text-white">MC</div>
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-bold text-[9px] text-white">AMEX</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
