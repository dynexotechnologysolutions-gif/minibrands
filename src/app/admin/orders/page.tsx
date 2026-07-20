"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronRight,
  Truck,
  DollarSign,
  Loader2,
  Clock,
} from "lucide-react";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch(`/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
        setIsLoading(false);
      });
  }, [statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Marketplace Order Registry</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Order Management & Shipping Timeline
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Track order lifecycle, payment status, escrow release dates, and iCarry shipment tracking.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, buyer, seller..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar py-1">
          {["ALL", "created", "paid", "confirmed", "shipped", "delivered", "completed", "cancelled", "disputed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border flex-shrink-0 ${
                statusFilter === st
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface text-text-muted border-border-gray/70 hover:bg-surface-container-low"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading orders registry...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            No orders found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Buyer Customer</th>
                  <th className="py-3 px-4">Merchant Seller</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Tracking / AWB</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-on-surface">{o.buyerName}</p>
                      <p className="text-[10px] text-text-muted">{o.buyerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-on-surface font-semibold">{o.sellerName}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">
                      ₹{o.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      {o.icarryAwbNumber ? (
                        <span className="font-mono text-[11px] text-secondary font-bold">
                          AWB: {o.icarryAwbNumber}
                        </span>
                      ) : (
                        <span className="text-text-muted text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface border border-border-gray/50">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-bold text-primary hover:underline flex items-center justify-end gap-1"
                      >
                        <span>View Order</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
