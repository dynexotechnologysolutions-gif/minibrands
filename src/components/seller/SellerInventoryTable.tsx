"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { updateVariantStockAction } from "@/actions/seller-inventory-update.action";
import { deleteProduct } from "@/actions/product-delete.action";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  image: string;
  variantId: string;
  variantSize: string;
  stockCount: number;
  price: number; // in paise
  isPublished: boolean;
  category: string;
  updatedAt: string;
}

interface SellerInventoryTableProps {
  items: InventoryItem[];
  onRefresh?: () => void;
}

export default function SellerInventoryTable({ items, onRefresh }: SellerInventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"ALL" | "LOW" | "OUT">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Restock Modal State
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(10);
  const [isSavingRestock, setIsSavingRestock] = useState(false);

  // Filter Items
  const filteredItems = items.filter((item) => {
    // Search Query
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Category Filter
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

    // Status Tab Filter
    if (activeFilterTab === "LOW") return item.stockCount > 0 && item.stockCount <= 10;
    if (activeFilterTab === "OUT") return item.stockCount === 0;

    return true;
  });

  // Unique Categories for dropdown
  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  // Pagination Math
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (stockCount: number) => {
    if (stockCount === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-error-red/10 text-error-red border border-error-red/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <XCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (stockCount <= 10) {
      return (
        <span className="inline-flex items-center gap-1 bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-success-green/10 text-success-green border border-success-green/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3" />
        Healthy
      </span>
    );
  };

  const handleExecuteRestock = async () => {
    if (!restockItem) return;
    setIsSavingRestock(true);

    try {
      const res = await updateVariantStockAction({
        variantId: restockItem.variantId,
        stockCount: newStockInput,
      });

      if (res.success) {
        setRestockItem(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        alert(res.error?.message || "Failed to update stock");
      }
    } catch (err: any) {
      alert("Error saving stock update");
    } finally {
      setIsSavingRestock(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This product will be archived.`)) return;

    try {
      const res = await deleteProduct({ productId });
      if (res.success) {
        if (onRefresh) onRefresh();
        else window.location.reload();
      } else {
        alert(res.error?.message || "Failed to delete product");
      }
    } catch (err) {
      alert("Error deleting product");
    }
  };

  return (
    <div className="space-y-md" suppressHydrationWarning>
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-base bg-surface-container-lowest border border-border-gray p-base rounded-xl shadow-xs" suppressHydrationWarning>
        <div className="flex items-center gap-sm flex-1 max-w-md" suppressHydrationWarning>
          <div className="relative w-full" suppressHydrationWarning>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              suppressHydrationWarning
              placeholder="Search product name or SKU..."
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border-gray rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              suppressHydrationWarning
              className="px-md py-1.5 bg-surface border border-border-gray rounded-lg text-body-sm font-medium focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actionable Filter Tabs */}
        <div className="flex items-center gap-2" suppressHydrationWarning>
          <button
            onClick={() => {
              setActiveFilterTab("ALL");
              setCurrentPage(1);
            }}
            suppressHydrationWarning
            className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors ${
              activeFilterTab === "ALL"
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            onClick={() => {
              setActiveFilterTab("LOW");
              setCurrentPage(1);
            }}
            suppressHydrationWarning
            className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors flex items-center gap-xs ${
              activeFilterTab === "LOW"
                ? "bg-accent-yellow text-primary font-bold"
                : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-accent-yellow" />
            Low ({items.filter((i) => i.stockCount > 0 && i.stockCount <= 10).length})
          </button>
          <button
            onClick={() => {
              setActiveFilterTab("OUT");
              setCurrentPage(1);
            }}
            suppressHydrationWarning
            className={`px-4 py-1.5 font-label-bold text-xs rounded-full cursor-pointer transition-colors flex items-center gap-xs ${
              activeFilterTab === "OUT"
                ? "bg-error-red text-on-primary font-bold"
                : "bg-surface border border-border-gray hover:bg-surface-container-low text-text-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error-red" />
            Out ({items.filter((i) => i.stockCount === 0).length})
          </button>
        </div>
      </div>

      {/* Main Inventory Table Container */}
      <div className="bg-surface-container-lowest border border-border-gray rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-gray">
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider">
                  Product
                </th>
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider">
                  Variant / Size
                </th>
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider">
                  Stock Units
                </th>
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider">
                  Price
                </th>
                <th className="px-base py-md font-label-bold text-body-sm text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-xxl text-center text-text-muted font-body-md">
                    No products or inventory items match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={`${item.id}-${item.variantId}`} className="hover:bg-surface-container-low/30 transition-colors group">
                    {/* Product Name & Image */}
                    <td className="px-base py-md">
                      <div className="flex items-center gap-md">
                        <img
                          src={item.image || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-12 h-12 bg-surface-container border border-border-gray rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="max-w-[220px]">
                          <p className="font-label-bold text-label-bold truncate text-on-surface">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-text-muted font-mono uppercase">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Variant / Size */}
                    <td className="px-base py-md">
                      <span className="font-body-md text-body-md font-medium text-on-surface">
                        {item.variantSize || "Standard"}
                      </span>
                    </td>

                    {/* Stock Count */}
                    <td className="px-base py-md">
                      <span
                        className={`font-label-bold text-label-bold text-base ${
                          item.stockCount === 0
                            ? "text-error-red"
                            : item.stockCount <= 10
                            ? "text-accent-yellow"
                            : "text-on-surface"
                        }`}
                      >
                        {item.stockCount} units
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-base py-md text-center">
                      {getStatusBadge(item.stockCount)}
                    </td>

                    {/* Price */}
                    <td className="px-base py-md">
                      <span className="font-bold text-body-md text-on-surface">
                        ₹{(item.price / 100).toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="px-base py-md text-right whitespace-nowrap space-x-xs" suppressHydrationWarning>
                      {item.stockCount <= 10 && (
                        <button
                          onClick={() => {
                            setRestockItem(item);
                            setNewStockInput(item.stockCount + 10);
                          }}
                          suppressHydrationWarning
                          className={`px-3 py-1 font-bold text-[10px] rounded hover:opacity-90 transition-all cursor-pointer ${
                            item.stockCount === 0
                              ? "bg-error-red text-on-primary"
                              : "bg-accent-yellow text-primary"
                          }`}
                        >
                          RESTOCK
                        </button>
                      )}

                      <Link
                        href={`/seller/products/${item.id}/edit`}
                        className="inline-block p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        suppressHydrationWarning
                        className="p-2 hover:bg-error-container rounded-lg text-error-red transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="px-base py-4 flex flex-col sm:flex-row justify-between items-center bg-surface-container-low border-t border-border-gray gap-base">
          <div className="text-body-sm text-text-muted">
            Showing {paginatedItems.length} of {filteredItems.length} items
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-border-gray rounded-lg hover:bg-surface transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-md font-bold text-xs text-on-surface">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center border border-border-gray rounded-lg hover:bg-surface transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[480px] w-full shadow-2xl border border-slate-200 space-y-6 text-slate-900 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">
                  Quick Restock Inventory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Update available variant stock level</p>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5">
              <p className="font-bold text-sm text-slate-900">{restockItem.name}</p>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Variant / Size: <strong className="text-slate-900 font-bold">{restockItem.variantSize}</strong></span>
                <span>Current Stock: <strong className="text-red-600 font-extrabold">{restockItem.stockCount} units</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-xs uppercase tracking-wider text-slate-600">
                New Stock Count (Units)
              </label>
              <input
                type="number"
                min={0}
                value={newStockInput}
                onChange={(e) => setNewStockInput(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all bg-white"
                placeholder="Enter stock count..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestock}
                disabled={isSavingRestock}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSavingRestock && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isSavingRestock ? "Saving..." : "Update Stock"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
