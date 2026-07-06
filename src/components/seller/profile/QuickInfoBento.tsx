"use client";

import React, { useState } from "react";
import { Globe, Mail, Phone, Copy, Check } from "lucide-react";

interface QuickInfoBentoProps {
  sellerId: string;
  userEmail?: string;
  storeName?: string;
}

export default function QuickInfoBento({ sellerId, userEmail = "care@velvetlane.in", storeName = "Boutique" }: QuickInfoBentoProps) {
  const [copied, setCopied] = useState(false);
  const storeUrl = `minibrands.com/sellers/${sellerId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {/* Store Link Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
        <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
          <Globe className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Public Store Link</h4>
          <p className="text-xs font-mono text-slate-500 truncate mt-1">{storeUrl}</p>
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          className="text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:underline cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Public Link</span>
            </>
          )}
        </button>
      </div>

      {/* Support Email Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
        <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
          <Mail className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Merchant Email</h4>
          <p className="text-xs text-slate-500 truncate mt-1">{userEmail}</p>
        </div>
        <span className="text-slate-400 font-bold text-xs inline-block">Registered Contact</span>
      </div>

      {/* Contact No Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3 sm:col-span-2 md:col-span-1">
        <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
          <Phone className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Support Helpline</h4>
          <p className="text-xs text-slate-500 truncate mt-1">+91 (Verified Merchant)</p>
        </div>
        <span className="text-slate-400 font-bold text-xs inline-block">OTP Protected</span>
      </div>
    </div>
  );
}
