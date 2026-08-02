import React from "react";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  activeStatus: string;
  onStatusChange: (status: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function OrderFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  activeStatus,
  onStatusChange,
  totalCount,
  filteredCount,
}: OrderFiltersProps) {
  const statuses = [
    { value: "all", label: "All Orders" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-vl-card border border-vl-border rounded-2xl p-4 shadow-vl-soft">
        {/* Large Rounded Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-vl-muted pointer-events-none text-xl">
            search
          </span>
          <input
            className="w-full pl-11 pr-4 py-3 bg-vl-surface border border-vl-border rounded-xl text-sm outline-none focus:border-vl-primary focus:ring-1 focus:ring-vl-primary/30 transition-all font-vl-body text-vl-ink"
            placeholder="Search order ID, brand, product..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Sort and Counter wrapper */}
        <div className="flex flex-wrap items-center gap-4 justify-between sm:justify-end">
          <span className="text-xs font-bold text-vl-muted">
            {filteredCount === totalCount ? `${totalCount} Orders` : `Showing ${filteredCount} of ${totalCount}`}
          </span>
          
          {/* Custom Arrow Sort Select */}
          <div className="relative flex-shrink-0">
            <select
              className="bg-vl-surface border border-vl-border rounded-xl px-4 py-3 pr-10 text-xs font-bold text-vl-ink outline-none cursor-pointer font-vl-body focus:border-vl-primary transition-all appearance-none"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-vl-muted pointer-events-none text-lg">
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>

      {/* Premium Filter Chips (scrollable horizontally on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {statuses.map((status) => {
          const isActive = activeStatus === status.value;
          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-bold rounded-full transition-all duration-vl-fast cursor-pointer select-none ${
                isActive
                  ? "bg-vl-primary text-white shadow-[0_4px_12px_rgba(255,62,108,0.15)]"
                  : "bg-vl-surface hover:bg-vl-border/30 text-vl-muted hover:text-vl-ink border border-vl-border/60"
              }`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
