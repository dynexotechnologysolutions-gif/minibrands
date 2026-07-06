import React from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2, Layers } from "lucide-react";

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
    append({ size: "", stockCount: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base border-b border-border-gray/60 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Size Variants & Physical Inventory Stock</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Add size options with stock counts. At least one size with stock &gt; 0 is required to publish.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-md py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Size Variant</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-border-gray rounded-2xl p-lg text-center bg-surface/30">
          <p className="text-text-muted text-xs font-medium">No size variants added yet. Click &quot;Add Size Variant&quot; above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const sizeError = errors.variants?.[index]?.size;
            const stockError = errors.variants?.[index]?.stockCount;

            return (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-base p-md bg-surface-container-lowest border border-border-gray rounded-xl shadow-xs"
              >
                {/* Size Selector */}
                <div className="flex-1 w-full">
                  <label
                    htmlFor={`variants.${index}.size`}
                    className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1"
                  >
                    Garment Size
                  </label>
                  <select
                    id={`variants.${index}.size`}
                    className={`block w-full py-2 px-3 bg-surface border ${
                      sizeError ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
                    } rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 transition-all`}
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
                    <p className="text-error-red text-xs mt-1 font-bold">{sizeError.message}</p>
                  )}
                </div>

                {/* Stock Count */}
                <div className="w-full sm:w-40">
                  <label
                    htmlFor={`variants.${index}.stockCount`}
                    className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1"
                  >
                    Available Stock
                  </label>
                  <input
                    id={`variants.${index}.stockCount`}
                    type="number"
                    min="0"
                    placeholder="0"
                    className={`block w-full py-2 px-3 bg-surface border ${
                      stockError ? "border-error-red focus:ring-error-red" : "border-border-gray focus:ring-primary"
                    } rounded-lg text-sm font-bold text-on-surface focus:outline-none focus:ring-2 transition-all`}
                    {...register(`variants.${index}.stockCount` as const, { valueAsNumber: true })}
                  />
                  {stockError && (
                    <p className="text-error-red text-xs mt-1 font-bold">{stockError.message}</p>
                  )}
                </div>

                {/* Remove Button */}
                <div className="pt-2 sm:pt-4 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-text-muted hover:text-error-red hover:bg-error-red/10 rounded-lg transition-colors cursor-pointer"
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
        <p className="text-error-red text-xs font-bold mt-1">{errors.variants.message}</p>
      )}
    </div>
  );
}
