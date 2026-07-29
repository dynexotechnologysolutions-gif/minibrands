import { BadgeCheck } from "lucide-react";

interface TrustBadgeProps {
  label?: string;
  className?: string;
}

export default function TrustBadge({
  label = "Verified seller",
  className = "",
}: TrustBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-vl-success/10 px-2 py-1 text-[11px] font-semibold text-emerald-800 ${className}`}
      title={label}
    >
      <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.2} />
      <span>{label}</span>
    </span>
  );
}
