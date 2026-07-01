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
    { value: "shipped", label: "On the way" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
  ];

  return (
    <div className="space-y-base">
      {/* Search and Sort controls */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-surface border border-border-gray rounded p-base gap-base">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
            search
          </span>
          <input
            className="w-full pl-10 pr-base py-2 bg-surface-container border border-border-gray rounded text-body-sm outline-none focus:border-primary font-body-sm"
            placeholder="Search your orders"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-base justify-between w-full md:w-auto">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing {filteredCount} of {totalCount} orders
          </span>
          <select
            className="bg-surface-container border border-border-gray rounded px-2 py-1.5 text-body-sm outline-none cursor-pointer font-body-sm"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex flex-wrap items-center gap-sm bg-white border border-border-gray rounded p-sm shadow-sm">
        {statuses.map((status) => {
          const isActive = activeStatus === status.value;
          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              className={`px-base py-1.5 text-body-sm rounded font-label-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-surface-container-low"
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
