import type { ReactNode } from "react";

interface StatusMessageProps {
  tone?: "success" | "error" | "info" | "warning";
  children: ReactNode;
  className?: string;
}

const toneClasses = {
  success: "border-vl-success/25 bg-vl-success/10 text-emerald-900",
  error: "border-vl-danger/25 bg-vl-danger/10 text-red-900",
  info: "border-vl-secondary/20 bg-vl-secondary/10 text-indigo-950",
  warning: "border-vl-warning/25 bg-vl-warning/10 text-amber-950",
};

export default function StatusMessage({
  tone = "info",
  children,
  className = "",
}: StatusMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-vl-control border px-4 py-3 text-sm leading-5 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
