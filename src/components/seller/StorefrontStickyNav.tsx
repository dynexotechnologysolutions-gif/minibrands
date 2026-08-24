"use client";

import React, { useEffect } from "react";

interface StorefrontStickyNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviewCount: number;
}

export default function StorefrontStickyNav({
  activeTab,
  setActiveTab,
  reviewCount,
}: StorefrontStickyNavProps) {
  const tabs = [
    { id: "shop", label: "Shop" },
    { id: "reviews", label: `Reviews (${reviewCount})` },
    { id: "about", label: "About" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("storefront-", "");
            setActiveTab(id);
          }
        });
      },
      {
        rootMargin: "-30% 0px -65% 0px",
        threshold: 0,
      }
    );

    ["shop", "reviews", "about"].forEach((id) => {
      const el = document.getElementById(`storefront-${id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reviewCount, setActiveTab]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(`storefront-${id}`);
    if (el) {
      // Use scroll-margin on sections + header offset, smooth via CSS
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="sticky top-[calc(108px+env(safe-area-inset-top))] md:top-[80px] z-30 w-full bg-vl-card/90 backdrop-blur-md border-y border-vl-border">
      <div className="max-w-container-max mx-auto flex items-center justify-center">
        <nav className="flex gap-6 sm:gap-8 px-4" aria-label="Boutique sections">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                aria-selected={isActive}
                role="tab"
                className={`relative py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-vl-primary focus-visible:ring-offset-2 rounded-sm ${
                  isActive ? "text-vl-primary" : "text-vl-muted hover:text-vl-ink"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-vl-primary rounded-full" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
