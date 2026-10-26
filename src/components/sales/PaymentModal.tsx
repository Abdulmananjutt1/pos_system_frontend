"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Banknote } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { PaymentMethod } from "@/types";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  paymentMethod: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function PaymentModal({
  isOpen,
  onClose,
  total,
  paymentMethod,
  onMethodChange,
  onConfirm,
  isLoading = false,
}: PaymentModalProps) {
  const [cashGiven, setCashGiven] = useState<string>("");
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const change = cashGivenNum - total;
  const showChange = paymentMethod === "Cash" && cashGivenNum > 0;

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) setCashGiven("");
  }, [isOpen]);

  const canConfirm =
    paymentMethod !== "Cash" ||
    cashGivenNum === 0 ||
    cashGivenNum >= total;

  const quickAmounts = [total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter(
    (v, i, arr) => arr.indexOf(v) === i && v >= total
  ).slice(0, 4);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Payment" size="sm">
      <div className="space-y-5">
        {/* Total */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">
            Total Amount
          </p>
          <p className="text-3xl font-bold text-blue-700">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Payment Method
          </p>
          <PaymentMethodSelector
            selected={paymentMethod}
            onChange={onMethodChange}
          />
        </div>

        {/* Cash calculator */}
        {paymentMethod === "Cash" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Cash Received
              </label>
              <div className="relative">
                <Banknote
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  min={0}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder={formatCurrency(total)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashGiven(String(amt))}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-lg font-medium transition-colors"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            {/* Change */}
            {showChange && (
              <div
                className={`rounded-xl p-3 flex items-center justify-between ${
                  change < 0
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    change < 0 ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {change < 0 ? "Amount Short" : "Change to Return"}
                </span>
                <span
                  className={`text-base font-bold ${
                    change < 0 ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {formatCurrency(Math.abs(change))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            disabled={!canConfirm || isLoading}
            isLoading={isLoading}
          >
            <CheckCircle size={16} />
            Confirm Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}
