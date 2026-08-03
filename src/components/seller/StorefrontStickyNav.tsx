"use client";

import React from "react";

interface StorefrontStickyNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviewCount: number;
}

export default function StorefrontStickyNav({ activeTab, setActiveTab, reviewCount }: StorefrontStickyNavProps) {
  const tabs = [
    { id: "products", label: "Products" },
    { id: "reviews", label: `Reviews (${reviewCount})` },
    { id: "story", label: "Story & Policies" },
  ];

  return (
    <div className="sticky top-[80px] z-30 w-full bg-vl-card/90 backdrop-blur-md border-y border-vl-border">
      <div className="max-w-container-max mx-auto flex items-center justify-center">
        <nav className="flex gap-8 px-4" aria-label="Boutique profile tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  const el = document.getElementById(`storefront-${tab.id}`);
                  if (el) {
                    const offset = 140; // sticky header + nav height offset
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = el.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`relative py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none ${
                  isActive ? "text-vl-primary font-extrabold" : "text-vl-muted hover:text-vl-ink"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-vl-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
