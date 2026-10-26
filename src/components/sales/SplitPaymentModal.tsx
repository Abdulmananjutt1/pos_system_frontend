"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { PaymentMethod, SplitPaymentEntry } from "@/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (entries: SplitPaymentEntry[]) => void;
  isLoading?: boolean;
}

const defaultEntry = (): SplitPaymentEntry => ({ method: "Cash", amount: 0 });

export default function SplitPaymentModal({
  isOpen,
  onClose,
  total,
  onConfirm,
  isLoading = false,
}: SplitPaymentModalProps) {
  const [entries, setEntries] = useState<SplitPaymentEntry[]>([
    { method: "Cash", amount: total },
  ]);
  const [error, setError] = useState("");

  const allocated = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = total - allocated;

  const update = (idx: number, field: keyof SplitPaymentEntry, value: string | number) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
    setError("");
  };

  const add = () => {
    setEntries((prev) => [...prev, defaultEntry()]);
  };

  const remove = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    if (entries.some((e) => e.amount <= 0)) {
      setError("All payment entries must have an amount > 0");
      return;
    }
    if (Math.abs(remaining) > 0.01) {
      setError(`Total doesn't match: ${formatCurrency(Math.abs(remaining))} ${remaining > 0 ? "short" : "over"}`);
      return;
    }
    onConfirm(entries);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Payment" size="sm">
      <div className="space-y-4">
        {/* Total */}
        <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-blue-600 font-medium">Total Due</span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(total)}</span>
        </div>

        {/* Entries */}
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                value={entry.method}
                onChange={(e) => update(idx, "method", e.target.value as PaymentMethod)}
                className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={entry.amount || ""}
                onChange={(e) => update(idx, "amount", Number(e.target.value))}
                placeholder="Amount"
                className="w-28 text-right rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {entries.length > 1 && (
                <button
                  onClick={() => remove(idx)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add row */}
        {entries.length < PAYMENT_METHODS.length && (
          <button
            onClick={add}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus size={14} />
            Add payment method
          </button>
        )}

        {/* Balance */}
        <div className={`rounded-xl p-3 flex items-center justify-between ${
          Math.abs(remaining) < 0.01
            ? "bg-green-50 border border-green-100"
            : "bg-gray-50 border border-gray-100"
        }`}>
          <span className="text-sm font-medium text-gray-600">Remaining</span>
          <span className={`text-sm font-bold ${
            Math.abs(remaining) < 0.01 ? "text-green-600" : remaining > 0 ? "text-red-600" : "text-orange-600"
          }`}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < -0.01 && " (over)"}
          </span>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            <CheckCircle size={15} />
            Confirm Split
          </Button>
        </div>
      </div>
    </Modal>
  );
}
