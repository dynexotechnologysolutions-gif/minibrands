import React from "react";
import Link from "next/link";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderTimeline from "./OrderTimeline";
import OrderItem from "./OrderItem";

interface OrderItemInfo {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  price: number; // paise
  quantity: number;
  image: string;
  size?: string | null;
}

interface OrderInfo {
  id: string;
  status: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string | Date;
  sellerName: string;
  items: OrderItemInfo[];
}

interface OrderCardProps {
  order: OrderInfo;
  onCancel: (orderId: string) => void;
  onReturn: (orderId: string) => void;
  onBuyAgain: (productId: string, variantId: string) => void;
  onRate: (productId: string, name: string) => void;
  onTrack: (orderId: string) => void;
  onSupport: (orderId: string) => void;
  onChangeAddress: (orderId: string) => void;
}

export default function OrderCard({
  order,
  onCancel,
  onReturn,
  onBuyAgain,
  onRate,
  onTrack,
  onSupport,
  onChangeAddress,
}: OrderCardProps) {
  const currentStatus = (order.orderStatus || order.status || "").toLowerCase();

  const isDelivered = currentStatus === "delivered" || currentStatus === "completed";
  const isShipped = currentStatus === "shipped" || currentStatus === "out_for_delivery" || currentStatus === "out for delivery";
  const isCancelled = currentStatus === "cancelled";
  const isReturned = currentStatus === "returned" || currentStatus === "refunded" || currentStatus === "disputed";
  const isProcessing = !isDelivered && !isShipped && !isCancelled && !isReturned;

  // Check if eligible for return: delivered and within 7 days
  const canReturn = (() => {
    if (!isDelivered) return false;
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const limitMs = 7 * 24 * 60 * 60 * 1000;
    return elapsedMs <= limitMs;
  })();

  return (
    <div className="bg-surface border border-border-gray rounded overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-base md:flex items-start gap-lg">
        {/* Order Items & Info */}
        <div className="flex-1 space-y-md">
          {/* Header row with Order ID / Date */}
          <div className="flex justify-between items-center text-xs font-semibold text-secondary pb-xs border-b border-border-gray/30">
            <span>
              Order ID: <span className="font-mono text-primary font-bold text-[11px] select-all">{order.id}</span>
            </span>
            <span>
              Placed on: {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="space-y-base">
            {order.items.map((item) => (
              <OrderItem
                key={item.id}
                name={item.name}
                price={item.price}
                quantity={item.quantity}
                image={item.image}
                variantSize={item.size}
                sellerName={order.sellerName}
              />
            ))}
          </div>

          {/* Timeline for shipped/active orders */}
          {isShipped && (
            <OrderTimeline status={order.status} orderStatus={order.orderStatus} />
          )}

          {/* Footer Action Buttons */}
          <div className="mt-lg flex flex-wrap items-center gap-base pt-md">
            {/* Delivered Actions */}
            {isDelivered && (
              <>
                <button
                  onClick={() => {
                    const firstItem = order.items[0];
                    if (firstItem) onBuyAgain(firstItem.productId, firstItem.variantId);
                  }}
                  className="flex items-center gap-sm px-base py-2 bg-accent-yellow text-primary font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Buy It Again
                </button>
                <button
                  onClick={() => {
                    const firstItem = order.items[0];
                    if (firstItem) onRate(firstItem.productId, firstItem.name);
                  }}
                  className="flex items-center gap-sm px-base py-2 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined">grade</span>
                  Rate Product
                </button>
                {canReturn && (
                  <button
                    onClick={() => onReturn(order.id)}
                    className="flex items-center gap-sm px-base py-2 border border-error-red text-error-red font-label-bold text-label-bold rounded hover:bg-error-container transition-transform active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">keyboard_return</span>
                    Return Order
                  </button>
                )}
              </>
            )}

            {/* Shipped/Active Actions */}
            {isShipped && (
              <>
                <button
                  onClick={() => onTrack(order.id)}
                  className="px-base py-2 bg-primary text-white font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
                >
                  Track Package
                </button>
                <button
                  onClick={() => onSupport(order.id)}
                  className="px-base py-2 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                >
                  Support
                </button>
              </>
            )}

            {/* Processing/Created Actions */}
            {isProcessing && (
              <>
                <button
                  onClick={() => onCancel(order.id)}
                  className="px-base py-2 border border-error-red text-error-red font-label-bold text-label-bold rounded hover:bg-error-container transition-transform active:scale-95 cursor-pointer"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => onChangeAddress(order.id)}
                  className="px-base py-2 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                >
                  Change Address
                </button>
              </>
            )}

            {/* Cancelled / Returned Actions */}
            {(isCancelled || isReturned) && (
              <>
                <button
                  onClick={() => {
                    const firstItem = order.items[0];
                    if (firstItem) onBuyAgain(firstItem.productId, firstItem.variantId);
                  }}
                  className="flex items-center gap-sm px-base py-2 bg-accent-yellow text-primary font-label-bold text-label-bold rounded hover:opacity-90 transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Reorder Items
                </button>
                <button
                  onClick={() => onSupport(order.id)}
                  className="px-base py-2 border border-border-gray text-primary font-label-bold text-label-bold rounded hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                >
                  Support
                </button>
              </>
            )}

            {/* View Details Link */}
            <Link
              href={`/orders/${order.id}`}
              className="ml-auto text-secondary font-label-bold text-label-bold hover:text-primary transition-colors flex items-center gap-xs cursor-pointer select-none"
            >
              Order Details
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Right Side Order Status Info Badge (desktop alignment) */}
        <div className="w-full md:w-auto md:text-right mt-base md:mt-0 flex-shrink-0 md:pl-base">
          <OrderStatusBadge
            status={order.status}
            orderStatus={order.orderStatus}
            date={order.createdAt}
          />
          <p className="font-body-sm text-body-sm text-secondary mt-xs">
            {isDelivered && "Your item has been delivered"}
            {isShipped && "Shipped via Logistics Partner"}
            {isProcessing && "Preparing for dispatch"}
            {isCancelled && "This order has been cancelled"}
            {isReturned && "Item returned and processed"}
          </p>
        </div>
      </div>
    </div>
  );
}
