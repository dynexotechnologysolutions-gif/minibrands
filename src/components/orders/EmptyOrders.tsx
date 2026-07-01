import React from "react";
import Link from "next/link";

export default function EmptyOrders() {
  return (
    <div className="bg-surface border border-border-gray rounded p-xxl text-center max-w-2xl mx-auto space-y-lg shadow-sm my-xl">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-secondary">
        <span className="material-symbols-outlined text-[32px]">shopping_bag</span>
      </div>
      <div className="space-y-xs">
        <h3 className="font-headline-sm text-headline-sm text-primary">No Orders Placed Yet</h3>
        <p className="font-body-md text-secondary max-w-md mx-auto leading-relaxed">
          You haven't ordered anything yet. Browse our exclusive collection of curated local boutiques and independent brands.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-base justify-center pt-md">
        <Link
          href="/products"
          className="px-xl py-3 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 text-center"
        >
          Browse Products
        </Link>
        <Link
          href="/"
          className="px-xl py-3 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
