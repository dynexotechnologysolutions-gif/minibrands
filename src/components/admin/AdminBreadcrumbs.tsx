"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/admin") return null;

  const segments = pathname.split("/").filter(Boolean);

  // Skip leading "admin" if present
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const formattedName = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
      name: formattedName,
      href,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center gap-2 text-xs text-text-muted mb-4 px-1">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-on-surface transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Admin</span>
      </Link>
      {breadcrumbItems.slice(1).map((item) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="w-3 h-3 text-secondary/40" />
          {item.isLast ? (
            <span className="font-semibold text-on-surface">{item.name}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-on-surface transition-colors font-medium"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
