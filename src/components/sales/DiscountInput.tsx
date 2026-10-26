"use client";

import { DiscountType } from "@/hooks/useDiscountInput";
import { cn } from "@/lib/utils";

interface DiscountInputProps {
  discountType: DiscountType;
  discountValue: number;
  onTypeChange: (type: DiscountType) => void;
  onValueChange: (val: number) => void;
  subtotal: number;
}

export default function DiscountInput({
  discountType,
  discountValue,
  onTypeChange,
  onValueChange,
  subtotal,
}: DiscountInputProps) {
  const maxValue = discountType === "percent" ? 100 : subtotal;

  return (
    <div className="flex items-center gap-2">
      {/* Type toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
        {(["flat", "percent"] as DiscountType[]).map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-md transition-colors",
              discountType === t
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
            aria-label={t === "flat" ? "Flat discount in PKR" : "Percentage discount"}
          >
            {t === "flat" ? "PKR" : "%"}
          </button>
        ))}
      </div>

      {/* Value input */}
      <input
        type="number"
        min={0}
        max={maxValue}
        step={discountType === "percent" ? 1 : 10}
        value={discountValue || ""}
        onChange={(e) => {
          const val = Math.max(0, Math.min(Number(e.target.value), maxValue));
          onValueChange(val);
        }}
        placeholder="0"
        className="flex-1 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Discount amount"
      />
    </div>
  );
}
