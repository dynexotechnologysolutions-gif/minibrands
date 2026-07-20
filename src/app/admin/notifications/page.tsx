"use client";

import React, { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function NotificationsLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock fetch from NotificationLog model or API
    setLogs([
      { id: "1", to: "buyer@example.com", template: "ORDER_CONFIRMED", status: "sent", createdAt: new Date().toISOString() },
      { id: "2", to: "+919876543210", template: "WHATSAPP_OTP", status: "sent", createdAt: new Date().toISOString() },
      { id: "3", to: "seller@velvetlane.in", template: "KYC_APPROVED", status: "sent", createdAt: new Date().toISOString() },
    ]);
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <Bell className="w-4 h-4" />
            <span>Messaging Infrastructure</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            System Notification & Dispatch Logs
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Telemetry logs for Resend transactional emails and WhatsApp messaging alerts.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading notification dispatch logs...</span>
          </div>
        ) : (
          <div className="divide-y divide-border-gray/40 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-on-surface">{log.template}</p>
                  <p className="text-text-muted text-[11px]">Recipient: {log.to}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success-green/10 text-success-green border border-success-green/30">
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
