"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function SellersListPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("ALL");

  useEffect(() => {
    fetch(`/api/admin/sellers?kycStatus=${kycFilter}&search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setSellers(data.sellers || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch sellers:", err);
        setIsLoading(false);
      });
  }, [kycFilter, searchQuery]);

  const exportCsv = () => {
    if (!sellers.length) return;
    const headers = ["Seller ID", "Business Name", "Owner Name", "Owner Email", "Category", "City", "KYC Status", "Trust Score", "Total GMV (₹)"];
    const rows = sellers.map((s) => [
      s.id,
      `"${s.businessName}"`,
      `"${s.ownerName}"`,
      s.ownerEmail,
      s.category,
      s.city,
      s.kycStatus,
      s.trustScore,
      s.totalGmv,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sellers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Store className="w-4 h-4" />
            <span>Merchant Directory</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Sellers & Merchant Partners
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Manage verified stores, KYC verification status, GMV contribution, and trust scores.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search business name, category, owner, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "approved", "pending", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setKycFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                kycFilter === st
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface text-text-muted border-border-gray/70 hover:bg-surface-container-low"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers DataTable */}
      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading sellers directory...</span>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            No sellers found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-gray/60 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-container-lowest">
                  <th className="py-3 px-4">Merchant Business</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4">Total GMV</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/40 text-xs font-medium">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {s.businessName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-on-surface">{s.businessName}</p>
                          <p className="text-[10px] text-text-muted">{s.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-on-surface font-bold">{s.ownerName}</p>
                      <p className="text-[10px] text-text-muted">{s.ownerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-text-muted">{s.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          s.kycStatus === "approved"
                            ? "bg-success-green/10 text-success-green border-success-green/30"
                            : s.kycStatus === "rejected"
                            ? "bg-error-red/10 text-error-red border-error-red/30"
                            : "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30"
                        }`}
                      >
                        {s.kycStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-success-green">{s.trustScore}%</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-on-surface">
                      ₹{s.totalGmv.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/sellers/${s.id}`}
                        className="text-xs font-bold text-primary hover:underline flex items-center justify-end gap-1"
                      >
                        <span>View Profile</span>
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
