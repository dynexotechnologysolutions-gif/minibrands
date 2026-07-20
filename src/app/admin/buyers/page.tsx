"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { suspendUserAction } from "@/actions/admin-actions";

export default function BuyersListPage() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/buyers?search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setBuyers(data.buyers || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch buyers:", err);
        setIsLoading(false);
      });
  }, [searchQuery]);

  const handleToggleSuspend = async (buyerId: string, currentStatus: boolean) => {
    const res = await suspendUserAction(
      buyerId,
      !currentStatus,
      !currentStatus ? "Suspended by Admin in Buyers Directory." : undefined
    );

    if (res.success) {
      setBuyers((prev) =>
        prev.map((b) => (b.id === buyerId ? { ...b, isSuspended: !currentStatus } : b))
      );
      setToastMessage(`Buyer ${!currentStatus ? "suspended" : "unsuspended"} successfully.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-success-green/10 text-success-green border border-success-green/30 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Users className="w-4 h-4" />
            <span>Buyer Intelligence</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Buyers Directory & Abuse Management
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Monitor buyer abuse scores, return frequency, dispute history, and suspend abusive accounts.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search buyer name or email address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      {/* Buyers DataTable */}
      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading buyers directory...</span>
          </div>
        ) : buyers.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            No buyers found matching &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                  <th className="py-3 px-4">Buyer Customer</th>
                  <th className="py-3 px-4">Abuse Score</th>
                  <th className="py-3 px-4">Orders / Returns</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
                {buyers.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {b.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-on-surface">{b.name}</p>
                          <p className="text-[10px] text-text-muted">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={b.abuseScore > 30 ? "text-error-red font-bold" : "text-success-green"}>
                        {b.abuseScore.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {b.orderCount} orders • <span className={b.returnCount > 2 ? "text-error-red font-bold" : ""}>{b.returnCount} returns</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-on-surface">
                      ₹{b.totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          b.isSuspended
                            ? "bg-error-red/10 text-error-red border-error-red/30"
                            : "bg-success-green/10 text-success-green border-success-green/30"
                        }`}
                      >
                        {b.isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleSuspend(b.id, b.isSuspended)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            b.isSuspended
                              ? "bg-success-green text-white"
                              : "bg-error-red/10 text-error-red hover:bg-error-red hover:text-white"
                          }`}
                        >
                          {b.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <Link
                          href={`/admin/buyers/${b.id}`}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
