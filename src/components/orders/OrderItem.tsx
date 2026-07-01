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
    <div className="flex gap-base items-start py-sm first:pt-0 last:pb-0 border-b border-border-gray/30 last:border-b-0">
      <div className="w-24 h-24 flex-shrink-0">
        <img
          className="w-full h-full object-cover border border-border-gray rounded"
          src={image || "/placeholder.jpg"}
          alt={name}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-label-bold text-label-bold text-primary truncate">{name}</h3>
        <p className="font-body-sm text-body-sm text-secondary mt-xs">
          {variantSize ? `Size: ${variantSize}` : ""}
          {sellerName ? ` • Seller: ${sellerName}` : ""}
          {quantity > 1 ? ` • Qty: ${quantity}` : ""}
        </p>
        <p className="font-price-lg text-price-lg mt-sm">
          {formatPrice(price)}
          {quantity > 1 && (
            <span className="text-secondary font-body-sm font-normal text-xs ml-base">
              ({formatPrice(price)} x {quantity})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
