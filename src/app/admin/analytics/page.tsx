"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, ShoppingBag, Store, Sparkles, Loader2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-text-muted text-xs font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        <span>Loading analytics models...</span>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Marketplace Intelligence</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Growth Analytics & Category Trends
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Executive data visualizer tracking GMV velocity, order conversion, merchant retention, and customer growth.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-bold text-sm text-on-surface">GMV Velocity</h3>
          <p className="font-display font-extrabold text-3xl text-primary">₹{(m.totalGmv || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-text-muted">Lifetime Gross Merchandise Value</p>
        </div>

        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-bold text-sm text-on-surface">Average Order Value (AOV)</h3>
          <p className="font-display font-extrabold text-3xl text-success-green">₹{(m.aov || 0).toLocaleString("en-IN")}</p>
          <p className="text-xs text-text-muted">Average spend per transaction</p>
        </div>

        <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
          <h3 className="font-bold text-sm text-on-surface">Merchant Conversion</h3>
          <p className="font-display font-extrabold text-3xl text-indigo-600">{m.verifiedSellers || 0} / {m.activeSellers || 0}</p>
          <p className="text-xs text-text-muted">Verified onboarding ratio</p>
        </div>
      </div>
    </div>
  );
}
