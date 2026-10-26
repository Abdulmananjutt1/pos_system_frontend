"use client";

import { useState } from "react";
import { PackagePlus, PackageMinus, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Medicine } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AdjustType = "add" | "remove" | "set";

interface StockAdjustModalProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (medicineId: string, adjustment: number) => void;
}

export default function StockAdjustModal({
  medicine,
  isOpen,
  onClose,
  onAdjust,
}: StockAdjustModalProps) {
  const [type, setType] = useState<AdjustType>("add");
  const [qty, setQty] = useState<string>("");
  const [error, setError] = useState("");

  if (!medicine) return null;

  const qtyNum = parseInt(qty) || 0;

  const preview = (() => {
    if (type === "add") return medicine.stock + qtyNum;
    if (type === "remove") return Math.max(0, medicine.stock - qtyNum);
    return qtyNum;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || qtyNum <= 0) {
      setError("Enter a valid quantity");
      return;
    }
    if (type === "remove" && qtyNum > medicine.stock) {
      setError(`Cannot remove more than current stock (${medicine.stock})`);
      return;
    }

    let adjustment = 0;
    if (type === "add") adjustment = qtyNum;
    else if (type === "remove") adjustment = -qtyNum;
    else adjustment = qtyNum - medicine.stock; // set absolute

    onAdjust(medicine.id, adjustment);
    setQty("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setQty("");
    setError("");
    onClose();
  };

  const adjustTypes: { key: AdjustType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      key: "add",
      label: "Add Stock",
      icon: <PackagePlus size={15} />,
      color: "text-green-700 bg-green-50 border-green-300",
    },
    {
      key: "remove",
      label: "Remove Stock",
      icon: <PackageMinus size={15} />,
      color: "text-red-700 bg-red-50 border-red-300",
    },
    {
      key: "set",
      label: "Set Exact",
      icon: <RotateCcw size={15} />,
      color: "text-blue-700 bg-blue-50 border-blue-300",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adjust Stock" size="sm">
      <div className="space-y-5">
        {/* Medicine info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-semibold text-gray-800">{medicine.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.genericName} • {medicine.brand}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Current Stock</p>
              <p
                className={cn(
                  "font-bold text-lg",
                  medicine.stock === 0
                    ? "text-red-600"
                    : medicine.stock <= medicine.minStock
                    ? "text-yellow-600"
                    : "text-gray-900"
                )}
              >
                {medicine.stock}
                <span className="text-xs font-normal text-gray-400 ml-1">
                  {medicine.unit}s
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Min Stock</p>
              <p className="font-semibold text-gray-600">{medicine.minStock}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Purchase Price</p>
              <p className="font-semibold text-gray-600">
                {formatCurrency(medicine.purchasePrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Adjustment type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Adjustment Type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {adjustTypes.map(({ key, label, icon, color }) => (
              <button
                key={key}
                onClick={() => {
                  setType(key);
                  setQty("");
                  setError("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all",
                  type === key
                    ? color + " shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {type === "set" ? "New Stock Quantity" : "Quantity"}
            </label>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setError("");
              }}
              placeholder={type === "set" ? `Current: ${medicine.stock}` : "Enter quantity"}
              className={cn(
                "w-full px-3 py-2.5 text-sm rounded-xl border",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                error ? "border-red-400" : "border-gray-300"
              )}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Preview */}
          {qty && qtyNum > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Stock after adjustment</span>
              <span className="text-base font-bold text-blue-800">
                {preview} {medicine.unit}s
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" type="button" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Apply Adjustment
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
