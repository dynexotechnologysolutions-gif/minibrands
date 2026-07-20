"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function RefundsQueuePage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/returns")
      .then((res) => res.json())
      .then((data) => {
        setReturns(data.returns || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch refund queue:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Refund Operations</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Refund Queue & Razorpay Settlement Ledger
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Inspect approved return refunds, Razorpay refund transaction IDs, and failure overrides.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading refund queue...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                  <th className="py-3 px-4">Return ID</th>
                  <th className="py-3 px-4">Buyer Customer</th>
                  <th className="py-3 px-4">Merchant Seller</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4">Razorpay Refund ID</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">#{r.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{r.buyerName}</td>
                    <td className="py-3 px-4 text-text-muted">{r.sellerName}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">₹{r.refundAmount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {r.refund?.razorpayRefundId || "PROCESSING"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container text-on-surface border border-border-gray/50">
                        {r.status}
                      </span>
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
