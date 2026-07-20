"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/audit?search=${encodeURIComponent(searchQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch audit logs:", err);
        setIsLoading(false);
      });
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-3xl border border-border-gray/70">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" />
            <span>Compliance & Accountability</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            System Audit Logs & Action Trail
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Immutable log of administrative modifications, KYC decisions, user suspensions, and setting updates.
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search action name, admin email, reason..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-gray/70 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface rounded-3xl border border-border-gray/70 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <span>Loading audit log history...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs font-medium">
            No audit log entries recorded.
          </div>
        ) : (
          <div className="divide-y divide-border-gray/40">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;

              return (
                <div key={log.id} className="transition-colors">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs flex-shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-on-surface font-mono">
                            {log.action}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-container text-text-muted">
                            {log.actorRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted">
                          Actor: {log.actorEmail} • Target: {log.targetType || "N/A"} (#{log.targetId?.slice(0, 8) || "N/A"})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-surface-container-low/30 border-t border-border-gray/40 text-xs space-y-2">
                      <p className="font-bold text-on-surface">Reason: <span className="font-normal text-text-muted">{log.reason || "None specified"}</span></p>
                      {log.oldValue && (
                        <div>
                          <p className="font-bold text-text-muted text-[10px] uppercase">Previous Value:</p>
                          <pre className="p-2 rounded bg-surface border border-border-gray/50 text-[10px] font-mono overflow-x-auto">
                            {log.oldValue}
                          </pre>
                        </div>
                      )}
                      {log.newValue && (
                        <div>
                          <p className="font-bold text-text-muted text-[10px] uppercase">New Value:</p>
                          <pre className="p-2 rounded bg-surface border border-border-gray/50 text-[10px] font-mono text-success-green overflow-x-auto">
                            {log.newValue}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
