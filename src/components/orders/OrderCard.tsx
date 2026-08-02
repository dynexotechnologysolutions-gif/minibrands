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
  const s = (order.status || "").toLowerCase();
  const os = (order.orderStatus || "").toLowerCase();
  const isDelivered = s === "delivered" || s === "completed" || os === "delivered" || os === "completed";
  const isShipped = !isDelivered && (s === "shipped" || os === "shipped" || s === "out_for_delivery" || os === "out_for_delivery" || s === "out for delivery" || os === "out for delivery");
  const isCancelled = s === "cancelled" || os === "cancelled";
  const isReturned = s === "returned" || os === "returned" || s === "refunded" || os === "refunded" || s === "disputed" || os === "disputed";
  const isProcessing = !isDelivered && !isShipped && !isCancelled && !isReturned;

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Check if eligible for return: delivered and within 7 days
  const canReturn = (() => {
    if (!isDelivered) return false;
    if (!mounted) return true;
    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const limitMs = 7 * 24 * 60 * 60 * 1000;
    return elapsedMs <= limitMs;
  })();

  return (
    <div className="bg-vl-card border border-vl-border rounded-vl-card hover:shadow-vl-medium hover:-translate-y-0.5 transition-all duration-vl-standard overflow-hidden" suppressHydrationWarning>
      <div className="p-5 sm:p-6 md:flex items-start gap-6">
        {/* Order Items & Info */}
        <div className="flex-1 space-y-6">
          {/* Header row with Order ID / Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-vl-muted pb-4 border-b border-vl-border/60">
            <div className="flex items-center gap-1.5">
              <span>Order ID:</span>
              <span className="font-mono text-vl-ink font-bold text-[11px] select-all bg-vl-surface px-2 py-0.5 rounded border border-vl-border/50">{order.id}</span>
            </div>
            <span>
              Placed: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="space-y-4">
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

          {/* Timeline for active orders */}
          {!isCancelled && !isReturned && (
            <div className="pt-2 border-t border-vl-border/40">
              <OrderTimeline status={order.status} orderStatus={order.orderStatus} />
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-4 border-t border-vl-border/40" suppressHydrationWarning>
            {/* Delivered Actions */}
            {isDelivered && (
              <>
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  download={`minibrands_Invoice_${order.id.substring(0, 8).toUpperCase()}.pdf`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-5 py-2.5 bg-vl-primary text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(255,62,108,0.12)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Invoice PDF
                </a>
                <button
                  onClick={() => {
                    const firstItem = order.items[0];
                    if (firstItem) onBuyAgain(firstItem.productId, firstItem.variantId);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-5 py-2.5 bg-vl-primary text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(255,62,108,0.12)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Buy It Again
                </button>
                <button
                  onClick={() => {
                    const firstItem = order.items[0];
                    if (firstItem) onRate(firstItem.productId, firstItem.name);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-5 py-2.5 border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary font-bold text-xs rounded-xl active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  <span className="material-symbols-outlined text-base">grade</span>
                  Rate Product
                </button>
                {canReturn && (
                  <button
                    onClick={() => onReturn(order.id)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-5 py-2.5 border border-red-100 text-vl-danger font-bold text-xs rounded-xl hover:border-vl-danger hover:bg-red-50/50 active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                  >
                    <span className="material-symbols-outlined text-base">keyboard_return</span>
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
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 bg-vl-primary text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(255,62,108,0.12)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  Track Package
                </button>
                <button
                  onClick={() => onSupport(order.id)}
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary font-bold text-xs rounded-xl active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
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
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 border border-red-100 text-vl-danger font-bold text-xs rounded-xl hover:border-vl-danger hover:bg-red-50/50 active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => onChangeAddress(order.id)}
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary font-bold text-xs rounded-xl active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
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
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 px-5 py-2.5 bg-vl-primary text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(255,62,108,0.12)] hover:bg-vl-primary-strong active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Reorder Items
                </button>
                <button
                  onClick={() => onSupport(order.id)}
                  className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 border border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary font-bold text-xs rounded-xl active:scale-95 transition-all duration-vl-fast cursor-pointer w-full sm:w-auto text-center"
                >
                  Support
                </button>
              </>
            )}

            {/* View Details Link */}
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center justify-center gap-1 text-xs font-bold text-vl-primary hover:text-vl-primary-strong transition-colors cursor-pointer select-none group w-full sm:w-auto sm:ml-auto pt-2 sm:pt-0"
            >
              <span>View Details</span>
              <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">chevron_right</span>
            </Link>
          </div>
        </div>

        {/* Right Side Order Status Info Badge (desktop alignment) */}
        <div className="w-full md:w-auto md:text-right mt-6 md:mt-0 flex flex-col items-start md:items-end justify-start flex-shrink-0 md:pl-6 border-t md:border-t-0 md:border-l border-vl-border/60 pt-4 md:pt-0 self-stretch">
          <OrderStatusBadge
            status={order.status}
            orderStatus={order.orderStatus}
            date={order.createdAt}
          />
          <p className="text-xs text-vl-muted mt-2 font-vl-body leading-normal">
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
