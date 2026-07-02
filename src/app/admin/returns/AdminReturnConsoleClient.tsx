"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReturnRequestStatus } from "@prisma/client";
import { adminOverrideReturnRequestAction } from "@/modules/returns/actions/return.actions";
import HomeHeader from "@/components/home/HomeHeader";

interface ReturnRecord {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAbuseScore: number;
  sellerName: string;
  status: ReturnRequestStatus;
  reason: string;
  comment: string | null;
  refundAmount: number;
  createdAt: string;
  refund: { id: string; razorpayRefundId: string | null; status: string } | null;
}

interface Metrics {
  totalReturns: number;
  totalRefundedAmount: number;
  pendingInspections: number;
  activeDisputes: number;
}

interface AdminReturnConsoleClientProps {
  returns: ReturnRecord[];
  metrics: Metrics;
}

export default function AdminReturnConsoleClient({ returns, metrics }: AdminReturnConsoleClientProps) {
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [overrideComment, setOverrideComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminOverride = async (targetStatus: ReturnRequestStatus) => {
    if (!selectedReturn) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await adminOverrideReturnRequestAction(
        selectedReturn.id,
        targetStatus,
        overrideComment
      );

      if (res.success) {
        setSelectedReturn(null);
        window.location.reload();
      } else {
        setErrorMsg(res.error?.message || "Override failed.");
      }
    } catch (err: any) {
      setErrorMsg("An error occurred executing admin override.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-lg">
      <HomeHeader />

      {/* Admin Title Banner */}
      <div className="flex items-center justify-between border-b border-border-gray pb-md pt-md">
        <div>
          <span className="px-xs py-xs bg-error-container text-error font-bold text-xs uppercase rounded">
            Admin Portal
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface mt-xs">
            Return Analytics & Dispute Console
          </h1>
          <p className="text-body-sm text-text-muted">
            Global marketplace oversight, fraud monitoring, and administrative dispute overrides.
          </p>
        </div>

        <Link
          href="/"
          className="px-md py-xs border border-border-gray rounded text-body-sm font-bold text-primary hover:bg-surface-container"
        >
          ← Home
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bg-white border border-border-gray rounded p-md space-y-xs shadow-sm">
          <p className="text-body-sm font-bold text-text-muted uppercase">Total Return Requests</p>
          <p className="text-3xl font-black text-on-surface">{metrics.totalReturns}</p>
        </div>

        <div className="bg-white border border-border-gray rounded p-md space-y-xs shadow-sm">
          <p className="text-body-sm font-bold text-text-muted uppercase">Total Value Refunded</p>
          <p className="text-3xl font-black text-success-green">
            ₹{(metrics.totalRefundedAmount / 100).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white border border-border-gray rounded p-md space-y-xs shadow-sm">
          <p className="text-body-sm font-bold text-text-muted uppercase">Pending Inspections</p>
          <p className="text-3xl font-black text-primary">{metrics.pendingInspections}</p>
        </div>

        <div className="bg-white border border-border-gray rounded p-md space-y-xs shadow-sm border-l-4 border-l-error">
          <p className="text-body-sm font-bold text-error uppercase">Active Disputes</p>
          <p className="text-3xl font-black text-error">{metrics.activeDisputes}</p>
        </div>
      </div>

      {/* Returns Audit Table */}
      <div className="bg-white border border-border-gray rounded p-lg space-y-md shadow-sm">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          All Marketplace Returns
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm border-collapse">
            <thead>
              <tr className="border-b border-border-gray bg-surface-container-low text-secondary font-bold">
                <th className="p-sm">Return ID</th>
                <th className="p-sm">Buyer</th>
                <th className="p-sm">Seller</th>
                <th className="p-sm">Risk Score</th>
                <th className="p-sm">Amount</th>
                <th className="p-sm">Status</th>
                <th className="p-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((item) => (
                <tr key={item.id} className="border-b border-border-gray/40 hover:bg-surface-container-low/50">
                  <td className="p-sm font-mono font-bold text-primary">{item.id.slice(0, 8)}</td>
                  <td className="p-sm">
                    <p className="font-bold text-on-surface">{item.buyerName}</p>
                    <p className="text-xs text-text-muted">{item.buyerEmail}</p>
                  </td>
                  <td className="p-sm font-bold text-on-surface">{item.sellerName}</td>
                  <td className="p-sm">
                    <span
                      className={`font-bold ${
                        item.buyerAbuseScore > 0.4 ? "text-error font-black" : "text-success-green"
                      }`}
                    >
                      {(item.buyerAbuseScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="p-sm font-bold text-on-surface">
                    ₹{(item.refundAmount / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="p-sm">
                    <span className="px-xs py-xs rounded bg-surface-container font-bold text-xs uppercase text-primary">
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-sm">
                    <button
                      onClick={() => {
                        setSelectedReturn(item);
                        setOverrideComment("");
                        setErrorMsg(null);
                      }}
                      className="px-sm py-xs bg-primary text-on-primary font-bold text-xs rounded hover:opacity-90"
                    >
                      Admin Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-base">
          <div className="bg-white rounded-lg p-lg max-w-lg w-full space-y-md shadow-xl">
            <div className="flex items-center justify-between border-b border-border-gray pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Admin Override - Return #{selectedReturn.id.slice(0, 8)}
              </h3>
              <button onClick={() => setSelectedReturn(null)} className="text-text-muted hover:text-on-surface text-xl font-bold">
                ×
              </button>
            </div>

            {errorMsg && (
              <div className="p-sm bg-error-container text-error rounded font-bold text-body-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-xs text-body-sm">
              <p>Buyer: <span className="font-bold">{selectedReturn.buyerName}</span></p>
              <p>Seller: <span className="font-bold">{selectedReturn.sellerName}</span></p>
              <p>Current Status: <span className="font-bold uppercase">{selectedReturn.status}</span></p>
            </div>

            <div>
              <label className="block font-bold text-body-sm text-secondary">Override Reason / Audit Note</label>
              <textarea
                value={overrideComment}
                onChange={(e) => setOverrideComment(e.target.value)}
                rows={3}
                placeholder="Explain why an administrative override is being performed..."
                className="w-full p-sm border border-border-gray rounded text-body-sm"
              />
            </div>

            <div className="flex justify-end gap-md pt-sm">
              <button
                onClick={() => handleAdminOverride(ReturnRequestStatus.REJECTED)}
                disabled={isProcessing}
                className="px-md py-sm bg-error text-on-primary font-bold text-body-sm rounded hover:opacity-90"
              >
                Force Reject Return
              </button>
              <button
                onClick={() => handleAdminOverride(ReturnRequestStatus.REFUND_APPROVED)}
                disabled={isProcessing}
                className="px-md py-sm bg-success-green text-on-primary font-bold text-body-sm rounded hover:opacity-90"
              >
                Force Approve Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
