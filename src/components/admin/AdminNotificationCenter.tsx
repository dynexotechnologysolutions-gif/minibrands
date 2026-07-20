"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "kyc" | "refund" | "dispute" | "payment" | "escrow" | "system";
  unread: boolean;
  link?: string;
}

interface AdminNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "Pending KYC Approval",
    message: "Urban Threads Store submitted Aadhaar & PAN verification documents.",
    timestamp: "10 mins ago",
    type: "kyc",
    unread: true,
    link: "/admin/kyc-queue",
  },
  {
    id: "notif-2",
    title: "Escalated Return Dispute",
    message: "Buyer filed dispute for Order #ORD-88219 (Damaged item claim).",
    timestamp: "45 mins ago",
    type: "dispute",
    unread: true,
    link: "/admin/returns",
  },
  {
    id: "notif-3",
    title: "Escrow Auto-Release Ready",
    message: "₹45,800 scheduled for release to 4 verified sellers today.",
    timestamp: "2 hours ago",
    type: "escrow",
    unread: false,
    link: "/admin/finance",
  },
  {
    id: "notif-4",
    title: "Refund Request Initiated",
    message: "Refund of ₹2,499 requested for Order #ORD-77102.",
    timestamp: "4 hours ago",
    type: "refund",
    unread: false,
    link: "/admin/refunds",
  },
];

export default function AdminNotificationCenter({ isOpen, onClose }: AdminNotificationCenterProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(MOCK_NOTIFICATIONS);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "kyc":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case "dispute":
        return <AlertTriangle className="w-4 h-4 text-error-red" />;
      case "refund":
        return <RotateCcw className="w-4 h-4 text-accent-yellow" />;
      case "escrow":
      case "payment":
        return <DollarSign className="w-4 h-4 text-success-green" />;
      default:
        return <Bell className="w-4 h-4 text-secondary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-surface h-full shadow-2xl border-l border-border-gray/60 flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-gray/40 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                Admin Notifications
              </h3>
              <p className="text-[11px] text-text-muted">Real-time alerts & action items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-container-low text-text-muted hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.unread
                  ? "bg-surface-container-lowest border-primary/30 shadow-xs"
                  : "bg-surface-container-low/50 border-border-gray/40 opacity-80"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-surface border border-border-gray/50 flex-shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-body-sm font-bold text-on-surface">{item.title}</h4>
                    <span className="text-[10px] text-text-muted font-medium">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1 leading-snug">{item.message}</p>

                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={onClose}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <span>Take Action</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-lowest border-t border-border-gray/40 text-center">
          <Link
            href="/admin/notifications"
            onClick={onClose}
            className="text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            View Notification Logs & History →
          </Link>
        </div>
      </div>
    </div>
  );
}
