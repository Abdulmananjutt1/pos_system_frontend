"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Percent } from "lucide-react";
import { SaleItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CartItemProps {
  item: SaleItem;
  maxQty?: number;
  allowLineDiscount?: boolean;
  onUpdateQty: (medicineId: string, qty: number) => void;
  onUpdateDiscount?: (medicineId: string, discount: number) => void;
  onRemove: (medicineId: string) => void;
}

export default function CartItem({
  item,
  maxQty,
  allowLineDiscount = true,
  onUpdateQty,
  onUpdateDiscount,
  onRemove,
}: CartItemProps) {
  const canIncrease = maxQty === undefined || item.quantity < maxQty;
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discInput, setDiscInput] = useState(String(item.discount));

  const commitDiscount = () => {
    const v = Math.max(0, Math.min(100, Number(discInput) || 0));
    onUpdateDiscount?.(item.medicineId, v);
    setEditingDiscount(false);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 group">
      {/* Name + remove */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 leading-tight flex-1">
          {item.medicineName}
        </p>
        <button
          onClick={() => onRemove(item.medicineId)}
          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          aria-label={`Remove ${item.medicineName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Price × qty */}
      <p className="text-xs text-gray-400 mt-0.5">
        {formatCurrency(item.unitPrice)} × {item.quantity}
        {item.discount > 0 && (
          <span className="ml-1 text-green-600">({item.discount}% off)</span>
        )}
      </p>

      <div className="flex items-center justify-between mt-2">
        {/* Quantity controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUpdateQty(item.medicineId, item.quantity - 1)}
            className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={11} />
          </button>
          <span className="w-8 text-center text-sm font-bold text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQty(item.medicineId, item.quantity + 1)}
            disabled={!canIncrease}
            className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-green-50 hover:border-green-300 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus size={11} />
          </button>

          {/* Line discount */}
          {allowLineDiscount && onUpdateDiscount && (
            editingDiscount ? (
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discInput}
                  onChange={(e) => setDiscInput(e.target.value)}
                  onBlur={commitDiscount}
                  onKeyDown={(e) => e.key === "Enter" && commitDiscount()}
                  className="w-14 text-xs text-center border border-blue-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            ) : (
              <button
                onClick={() => { setDiscInput(String(item.discount)); setEditingDiscount(true); }}
                className="ml-1 flex items-center gap-0.5 text-xs text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Set line discount"
              >
                <Percent size={11} />
                {item.discount > 0 ? `${item.discount}%` : "Disc"}
              </button>
            )
          )}
        </div>

        <p className="text-sm font-bold text-gray-900">
          {formatCurrency(item.total)}
        </p>
      </div>
    </div>
  );
}
