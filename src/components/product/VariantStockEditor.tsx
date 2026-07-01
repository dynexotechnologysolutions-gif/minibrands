import React from "react";
import { Control, UseFormRegister, FieldErrors, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ProductCreateInput } from "@/schemas/product.schema";

interface VariantStockEditorProps {
  control: any;
  register: any;
  errors: any;
}

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "Free Size"];

export default function VariantStockEditor({ control, register, errors }: VariantStockEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const handleAddRow = () => {
    // Append a default empty variant
    append({ size: "", stockCount: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Sizes & Stock Levels</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add at least one size variant with stock greater than 0 to publish.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Size</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-xs">No size variants added yet. Click &quot;Add Size&quot; above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const sizeError = errors.variants?.[index]?.size;
            const stockError = errors.variants?.[index]?.stockCount;

            return (
              <div
                key={field.id}
                className="flex items-start gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl animate-fade-in-up"
              >
                {/* Size Selector */}
                <div className="flex-1">
                  <label
                    htmlFor={`variants.${index}.size`}
                    className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
                  >
                    Size
                  </label>
                  <select
                    id={`variants.${index}.size`}
                    className={`block w-full py-2.5 px-3 bg-white border ${
                      sizeError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}
                    {...register(`variants.${index}.size` as const)}
                  >
                    <option value="">Select size...</option>
                    {SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {sizeError && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{sizeError.message}</p>
                  )}
                </div>

                {/* Stock Count */}
                <div className="w-32">
                  <label
                    htmlFor={`variants.${index}.stockCount`}
                    className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
                  >
                    Stock Count
                  </label>
                  <input
                    id={`variants.${index}.stockCount`}
                    type="number"
                    min="0"
                    placeholder="0"
                    className={`block w-full py-2.5 px-3 bg-white border ${
                      stockError ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    } rounded-lg text-sm focus:outline-none focus:ring-2 transition-all`}
                    {...register(`variants.${index}.stockCount` as const, { valueAsNumber: true })}
                  />
                  {stockError && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{stockError.message}</p>
                  )}
                </div>

                {/* Remove Button */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errors.variants && !Array.isArray(errors.variants) && (
        <p className="text-red-600 text-xs font-medium mt-1">{errors.variants.message}</p>
      )}
    </div>
  );
}
