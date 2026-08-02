"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Product pages">
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className={`inline-flex min-h-11 items-center gap-2 rounded-vl-control border px-4 text-sm font-semibold transition-all duration-vl-fast ${
          currentPage === 1
            ? "cursor-not-allowed border-vl-border text-vl-muted/40"
            : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
        }`}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous
      </button>

      {/* Pages list */}
      <div className="flex items-center gap-1">
        {getPages().map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className="flex h-10 w-10 select-none items-center justify-center text-sm font-semibold text-vl-muted"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = currentPage === pageNum;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-vl-fast ${
                isActive
                  ? "bg-vl-primary text-white shadow-vl-soft"
                  : "text-vl-ink hover:bg-vl-surface active:scale-95"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`inline-flex min-h-11 items-center gap-2 rounded-vl-control border px-4 text-sm font-semibold transition-all duration-vl-fast ${
          currentPage === totalPages
            ? "cursor-not-allowed border-vl-border text-vl-muted/40"
            : "border-vl-border bg-vl-card text-vl-ink hover:border-vl-primary hover:text-vl-primary active:scale-[0.98]"
        }`}
      >
        Next <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
