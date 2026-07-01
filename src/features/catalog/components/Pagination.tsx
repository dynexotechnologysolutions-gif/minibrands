"use client";

import React from "react";

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
    <div className="mt-xxl flex justify-center items-center gap-sm">
      {/* Previous Button */}
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className={`flex items-center gap-xs px-base py-2 font-label-bold text-body-md border rounded-lg transition-all ${
          currentPage === 1
            ? "text-text-muted border-outline-variant opacity-50 cursor-not-allowed"
            : "text-on-surface hover:text-primary border-outline-variant cursor-pointer"
        }`}
      >
        <span className="material-symbols-outlined select-none">chevron_left</span> Previous
      </button>

      {/* Pages list */}
      <div className="flex items-center gap-xs">
        {getPages().map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className="w-10 h-10 flex items-center justify-center text-text-muted font-bold select-none"
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
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "hover:bg-surface-container text-on-surface"
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
        className={`flex items-center gap-xs px-base py-2 font-label-bold text-body-md border rounded-lg transition-all ${
          currentPage === totalPages
            ? "text-text-muted border-outline-variant opacity-50 cursor-not-allowed"
            : "text-on-surface hover:text-primary border-outline-variant cursor-pointer"
        }`}
      >
        Next <span className="material-symbols-outlined select-none">chevron_right</span>
      </button>
    </div>
  );
}
