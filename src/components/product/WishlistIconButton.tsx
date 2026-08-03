"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
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
      window.dispatchEvent(new Event("wishlist-updated"));
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
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-sm top-sm z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 text-vl-muted shadow-vl-soft backdrop-blur-sm transition duration-vl-fast hover:scale-105 hover:text-vl-primary disabled:opacity-50"
      suppressHydrationWarning={true}
    >
      <Heart
        aria-hidden="true"
        className={`h-[18px] w-[18px] ${isWishlisted ? "fill-vl-primary text-vl-primary" : ""}`}
        strokeWidth={2}
      />
    </button>
  );
}
