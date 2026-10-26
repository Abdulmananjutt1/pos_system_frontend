"use client";

import { PauseCircle, PlayCircle, Trash2, X, Clock } from "lucide-react";
import { HeldSale } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface HeldSalesDrawerProps {
  heldSales: HeldSale[];
  isOpen: boolean;
  onClose: () => void;
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HeldSalesDrawer({
  heldSales,
  isOpen,
  onClose,
  onResume,
  onDelete,
}: HeldSalesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <PauseCircle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">Held Sales</h3>
            {heldSales.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                {heldSales.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {heldSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <PauseCircle size={40} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No held sales</p>
            </div>
          ) : (
            heldSales.map((held) => (
              <div
                key={held.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{held.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {held.customerName} • {held.cart.length} item{held.cart.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock size={11} />
                      {new Date(held.heldAt).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(
                        held.cart.reduce((s, i) => s + i.total, 0) - held.discount
                      )}
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="mt-2 space-y-0.5">
                  {held.cart.slice(0, 3).map((item) => (
                    <p key={item.medicineId} className="text-xs text-gray-400 truncate">
                      {item.quantity}× {item.medicineName}
                    </p>
                  ))}
                  {held.cart.length > 3 && (
                    <p className="text-xs text-gray-400">+{held.cart.length - 3} more…</p>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => { onResume(held.id); onClose(); }}
                  >
                    <PlayCircle size={13} />
                    Resume
                  </Button>
                  <button
                    onClick={() => onDelete(held.id)}
                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    aria-label="Delete held sale"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
