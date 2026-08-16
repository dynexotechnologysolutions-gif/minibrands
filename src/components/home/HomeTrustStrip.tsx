"use client";

import React from "react";

export default function HomeTrustStrip() {
  return (
    <section className="py-16 bg-gray-50" data-purpose="trust-badges">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="flex items-center gap-4 justify-center">
            <i className="fa-solid fa-shield-halved text-4xl text-[#0F7F7F]"></i>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">Secure Payment</span>
              <span className="text-sm text-gray-500">100% Safe</span>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <i className="fa-solid fa-box-open text-4xl text-[#0F7F7F]"></i>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">Easy Returns</span>
              <span className="text-sm text-gray-500">Hassle Free</span>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <i className="fa-solid fa-truck-fast text-4xl text-[#0F7F7F]"></i>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">Fast Delivery</span>
              <span className="text-sm text-gray-500">Across India</span>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center">
            <i className="fa-solid fa-hand-holding-dollar text-4xl text-[#0F7F7F]"></i>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">COD Available</span>
              <span className="text-sm text-gray-500">Pay on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
