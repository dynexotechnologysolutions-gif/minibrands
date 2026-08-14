"use client";

import React from "react";

export default function HomeTrustStrip() {
  return (
    <section className="mb-6 md:mb-12 bg-white md:py-8" data-purpose="trust-badges">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 border-t md:border-none border-gray-200 pt-4 md:pt-0">
          <div className="flex items-center gap-3 md:gap-4 md:justify-center">
            <i className="fa-solid fa-shield-halved text-2xl md:text-4xl w-8 md:w-12 text-center text-[#004F50]"></i>
            <div className="flex flex-col">
              <span className="text-xs md:text-base font-bold text-gray-800">Secure Payment</span>
              <span className="text-[10px] md:text-sm text-gray-500">100% Safe</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 md:justify-center">
            <i className="fa-solid fa-box-open text-2xl md:text-4xl w-8 md:w-12 text-center text-[#004F50]"></i>
            <div className="flex flex-col">
              <span className="text-xs md:text-base font-bold text-gray-800">Easy Returns</span>
              <span className="text-[10px] md:text-sm text-gray-500">Hassle Free</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 md:justify-center">
            <i className="fa-solid fa-truck-fast text-2xl md:text-4xl w-8 md:w-12 text-center text-[#004F50]"></i>
            <div className="flex flex-col">
              <span className="text-xs md:text-base font-bold text-gray-800">Fast Delivery</span>
              <span className="text-[10px] md:text-sm text-gray-500">Across India</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 md:justify-center">
            <i className="fa-solid fa-hand-holding-dollar text-2xl md:text-4xl w-8 md:w-12 text-center text-[#004F50]"></i>
            <div className="flex flex-col">
              <span className="text-xs md:text-base font-bold text-gray-800">COD Available</span>
              <span className="text-[10px] md:text-sm text-gray-500">Pay on Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
