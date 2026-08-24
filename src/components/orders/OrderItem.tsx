import React from "react";

interface OrderItemProps {
  name: string;
  price: number; // in paise
  quantity: number;
  image: string;
  variantSize?: string | null;
  sellerName?: string | null;
}

export default function OrderItem({
  name,
  price,
  quantity,
  image,
  variantSize,
  sellerName,
}: OrderItemProps) {
  const formatPrice = (amt: number) => {
    return (amt / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="flex gap-3 items-start py-3 first:pt-0 last:pb-0 border-b border-vl-border/60 last:border-b-0">
      {/* 3:4 Aspect Ratio Image Crop */}
      <div className="w-16 sm:w-20 aspect-[3/4] flex-shrink-0 bg-vl-surface border border-vl-border rounded-lg overflow-hidden">
        <img
          className="w-full h-full object-cover transition-transform duration-vl-slow hover:scale-105"
          src={image || "/placeholder.jpg"}
          alt={name}
        />
      </div>
      
      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-vl-heading font-bold text-vl-ink text-sm sm:text-base tracking-tight truncate hover:text-vl-primary transition-colors cursor-default">
          {name}
        </h3>
        
        {/* Modern Pill Chips */}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {variantSize && (
            <span className="px-2 py-0.5 bg-vl-surface border border-vl-border text-[11px] font-bold text-vl-muted rounded">
              Size: {variantSize}
            </span>
          )}
          {sellerName && (
            <span className="px-2 py-0.5 bg-vl-surface border border-vl-border text-[11px] font-bold text-vl-muted rounded">
              Boutique: {sellerName}
            </span>
          )}
          {quantity > 0 && (
            <span className="px-2 py-0.5 bg-vl-surface border border-vl-border text-[11px] font-bold text-vl-muted rounded">
              Qty: {quantity}
            </span>
          )}
        </div>

        {/* Pricing */}
        <p className="font-vl-heading font-extrabold text-vl-ink text-sm mt-2">
          Price: {formatPrice(price * quantity)}
          {quantity > 1 && (
            <span className="text-vl-muted font-vl-body font-medium text-xs ml-2">
              ({formatPrice(price)} x {quantity})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
