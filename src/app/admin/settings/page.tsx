"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Percent,
  Truck,
  Clock,
  ShieldAlert,
  Save,
  Loader2,
} from "lucide-react";
import { updatePlatformSettingAction } from "@/actions/admin-actions";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    TAX_PERCENTAGE: "18",
    COMMISSION_PERCENTAGE: "10",
    SHIPPING_FLAT_RATE: "99",
    ESCROW_HOLD_DAYS: "7",
    MAINTENANCE_MODE: "false",
    AI_MODERATION_ENABLED: "true",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    const res = await updatePlatformSettingAction(key, value, `Updated ${key} via Admin Settings Panel.`);
    setIsSaving(false);

    if (res.success) {
      setToast({ type: "success", text: `Platform setting '${key}' saved.` });
    } else {
      setToast({ type: "error", text: res.error?.message || "Failed to update setting." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            toast.type === "success"
              ? "bg-success-green/10 text-success-green border-success-green/30"
              : "bg-error-red/10 text-error-red border-error-red/30"
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Settings className="w-4 h-4" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            Global Marketplace Parameters & Feature Flags
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Configure commission percentage, GST rate, escrow holding window, shipping flat rate, and system maintenance.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-text-muted text-xs font-medium bg-surface rounded-3xl border border-border-gray/70">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
          <span>Loading platform settings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marketplace Fees & Tax */}
          <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
            <h3 className="font-display font-extrabold text-base text-on-surface">
              Taxation & Marketplace Fees
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-text-muted font-bold mb-1 uppercase text-[10px]">
                  Marketplace Commission (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settings.COMMISSION_PERCENTAGE}
                    onChange={(e) => handleChange("COMMISSION_PERCENTAGE", e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-on-surface font-bold"
                  />
                  <button
                    onClick={() => handleSaveSetting("COMMISSION_PERCENTAGE", settings.COMMISSION_PERCENTAGE)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-bold mb-1 uppercase text-[10px]">
                  GST Tax Rate (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settings.TAX_PERCENTAGE}
                    onChange={(e) => handleChange("TAX_PERCENTAGE", e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-on-surface font-bold"
                  />
                  <button
                    onClick={() => handleSaveSetting("TAX_PERCENTAGE", settings.TAX_PERCENTAGE)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment & Escrow Parameters */}
          <div className="p-6 rounded-3xl bg-surface border border-border-gray/70 space-y-4">
            <h3 className="font-display font-extrabold text-base text-on-surface">
              Escrow & Shipping Rules
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-text-muted font-bold mb-1 uppercase text-[10px]">
                  Escrow Release Holding Window (Days)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settings.ESCROW_HOLD_DAYS}
                    onChange={(e) => handleChange("ESCROW_HOLD_DAYS", e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-on-surface font-bold"
                  />
                  <button
                    onClick={() => handleSaveSetting("ESCROW_HOLD_DAYS", settings.ESCROW_HOLD_DAYS)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-muted font-bold mb-1 uppercase text-[10px]">
                  Standard Flat Shipping Fee (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={settings.SHIPPING_FLAT_RATE}
                    onChange={(e) => handleChange("SHIPPING_FLAT_RATE", e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-surface-container-lowest border border-border-gray/70 text-on-surface font-bold"
                  />
                  <button
                    onClick={() => handleSaveSetting("SHIPPING_FLAT_RATE", settings.SHIPPING_FLAT_RATE)}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
