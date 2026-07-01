"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addToWishlistAction, removeFromWishlistAction } from "@/actions/wishlist.action";

interface WishlistIconButtonProps {
  productId: string;
  isLoggedIn: boolean;
  initialIsWishlisted: boolean;
}

export default function WishlistIconButton({
  productId,
  isLoggedIn,
  initialIsWishlisted,
}: WishlistIconButtonProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isToggling, setIsToggling] = useState(false);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?redirectTo=${encodeURIComponent("/")}`);
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    const nextState = !isWishlisted;
    // Optimistic update
    setIsWishlisted(nextState);

    // If it's a mock product, just toggle locally and complete
    if (productId.startsWith("mock-")) {
      setIsToggling(false);
      return;
    }

    try {
      if (nextState) {
        const res = await addToWishlistAction(productId);
        if (!res.success) throw new Error(res.error || "Failed to add to wishlist");
      } else {
        const res = await removeFromWishlistAction(productId);
        if (!res.success) throw new Error(res.error || "Failed to remove from wishlist");
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      // Revert on error
      setIsWishlisted(!nextState);
      alert("Failed to update wishlist. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleWishlistClick}
      disabled={isToggling}
      className="absolute top-sm right-sm w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-text-muted hover:text-error-red transition-colors z-10 cursor-pointer disabled:opacity-50 animate-fade-in"
    >
      <span
        className={`material-symbols-outlined text-[20px] transition-colors ${
          isWishlisted ? "text-error-red" : ""
        }`}
        style={{
          fontVariationSettings: isWishlisted
            ? "'FILL' 1, 'wght' 400"
            : "'FILL' 0, 'wght' 400",
        }}
      >
        favorite
      </span>
    </button>
  );
}
