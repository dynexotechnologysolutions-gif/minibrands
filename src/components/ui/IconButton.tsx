import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  active?: boolean;
  size?: "sm" | "md";
}

export default function IconButton({
  label,
  children,
  active = false,
  size = "md",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const sizeClass = size === "sm" ? "min-h-10 min-w-10" : "min-h-11 min-w-11";

  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-vl-border bg-vl-card text-vl-muted shadow-vl-soft transition duration-vl-fast ease-vl-out hover:-translate-y-0.5 hover:border-vl-primary/30 hover:text-vl-primary hover:shadow-vl-medium active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
