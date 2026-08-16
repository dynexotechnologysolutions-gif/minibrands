"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import WishlistIconButton from "@/components/product/WishlistIconButton";
import { reserveCartItem } from "@/actions/cart-reserve.action";

export interface FlashSaleProduct {
  id: string;
  name: string;
  price: number; // paise
  images: { url: string }[];
  variants?: { id?: string; size?: string; stockCount?: number }[];
  seller: { businessName: string };
}

interface HomeFlashSaleProps {
  products: FlashSaleProduct[];
  isLoggedIn?: boolean;
  wishlistIds?: string[];
}

const fmt = (p: number) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

function FlashCard({
  product,
  isLoggedIn,
  isWishlisted,
}: {
  product: FlashSaleProduct;
  isLoggedIn: boolean;
  isWishlisted: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    try {
      const variantId = product.variants?.[0]?.id || "default";
      const res = await reserveCartItem({ productId: product.id, variantId, quantity: 1 });
      if (res.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } else {
        alert(res.error?.message || "Failed to add to cart");
      }
    } catch { /* noop */ }
    finally { setAdding(false); }
  };

  const mainImg = product.images?.[0]?.url || null;
  const price = fmt(product.price);
  const orig = fmt(Math.round(product.price * 1.6));
  const stockCount = product.variants?.[0]?.stockCount ?? 4;
  const stockPct = Math.max(25, 100 - stockCount * 12);

  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white rounded-[12px] p-3 md:p-4 flex flex-col shadow-sm border border-gray-100 hover:shadow-md transition group"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[#F7F9F9] rounded-[8px] mb-3 flex items-center justify-center p-2 overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <WishlistIconButton productId={product.id} isLoggedIn={isLoggedIn} initialIsWishlisted={isWishlisted} />
        </div>
        {mainImg ? (
          <Image
            src={mainImg}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="fa-solid fa-image text-gray-300 text-3xl"></i>
          </div>
        )}
      </div>

      {/* Info Container */}
      <h4 className="text-[14px] font-medium text-[#222222] line-clamp-1 mb-1 leading-tight">{product.name}</h4>
      
      {/* Rating */}
      <div className="flex items-center gap-1 text-[12px] text-gray-500 mb-2">
        <span className="text-[#222222] font-medium">4.8</span>
        <i className="fa-solid fa-star text-[#F39C12] text-[10px]"></i>
        <span>(1.2k)</span>
      </div>

      {/* Pricing */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-[18px] font-bold text-[#222222]">{price}</span>
        <span className="text-[13px] text-[#999999] line-through">{orig}</span>
      </div>

      {/* Stock indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mr-2">
          <div className="h-full bg-brand-orange" style={{ width: `${stockPct}%` }}></div>
        </div>
        <span className="text-[10px] text-brand-red font-bold whitespace-nowrap">{stockCount} left</span>
      </div>

      {/* CTA Grab Deal */}
      <button
        suppressHydrationWarning
        onClick={handleAdd}
        disabled={adding}
        className={`w-full h-[40px] text-white rounded-[8px] text-sm font-semibold mt-auto hover:bg-opacity-90 transition shadow-sm ${
          added ? "bg-green-600" : "bg-[#F39C12]"
        }`}
      >
        {added ? "Added!" : adding ? "Adding..." : "Grab Deal"}
      </button>
    </Link>
  );
}

function Countdown() {
  const [time, setTime] = useState({ h: 3, m: 45, s: 12 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="bg-brand-red/90 text-white text-[10px] md:text-sm font-bold px-3 py-2 md:px-4 md:py-3 rounded-lg flex items-center gap-2 shadow-sm">
      <i className="fa-regular fa-clock"></i>
      <span className="bg-white/20 px-2 py-1 rounded tracking-widest">
        {pad(time.h)}h : {pad(time.m)}m : {pad(time.s)}s
      </span>
    </div>
  );
}

export default function HomeFlashSale({ products, isLoggedIn = false, wishlistIds = [] }: HomeFlashSaleProps) {
  return (
    <section className="mb-8 md:mb-12 px-4 md:px-0" data-purpose="flash-sale">
      {/* Dark container box */}
      <div className="bg-brand-dark rounded-xl md:rounded-2xl p-4 md:p-8 shadow-lg overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row gap-6">
          {/* Header & Timer Sidebar */}
          <div className="md:w-1/4 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start mb-4 md:mb-0 md:pr-6 md:border-r md:border-white/20">
            <h4 className="text-white text-xl md:text-4xl font-bold flex items-center gap-2 md:mb-6 leading-tight">
              Flash<br className="hidden md:block" /> Sale
            </h4>
            <div className="flex flex-col gap-2">
              <p className="text-gray-300 text-sm hidden md:block">Don&apos;t miss out! Offers end in:</p>
              <Countdown />
              <Link href="/products" className="text-brand-orange text-sm font-semibold hover:underline hidden md:inline-block mt-4">
                View all deals →
              </Link>
            </div>
          </div>

          {/* Product grid */}
          <div className="md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pb-2">
            {products.slice(0, 4).map((p) => (
              <FlashCard
                key={p.id}
                product={p}
                isLoggedIn={isLoggedIn}
                isWishlisted={wishlistIds.includes(p.id)}
              />
            ))}
            {products.length === 0 && (
              <div className="col-span-4 text-center text-gray-400 py-8">
                <i className="fa-solid fa-box-open text-4xl mb-3 block"></i>
                <p>Flash deals loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
