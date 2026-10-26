"use client";

import { RefreshCw, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Medicine } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface GenericSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMedicine: Medicine | null;
  substitutes: Medicine[];
  onSelect: (medicine: Medicine) => void;
}

export default function GenericSubstitutionModal({
  isOpen, onClose, sourceMedicine, substitutes, onSelect,
}: GenericSubstitutionModalProps) {
  if (!sourceMedicine) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generic Substitutes" size="lg">
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Currently Selected</p>
          <p className="text-sm font-semibold text-blue-800">{sourceMedicine.name}</p>
          <p className="text-xs text-blue-600">{sourceMedicine.genericName} • {sourceMedicine.brand}</p>
          <p className="text-sm font-bold text-blue-700 mt-1">{formatCurrency(sourceMedicine.sellingPrice)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Alternative brands with same generic — {sourceMedicine.genericName}
          </p>
          {substitutes.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No substitutes available with current stock</p>
          ) : (
            <div className="space-y-2">
              {substitutes.map((med) => {
                const priceDiff = med.sellingPrice - sourceMedicine.sellingPrice;
                return (
                  <div key={med.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{med.name}</p>
                        {med.requiresPrescription && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">Rx</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{med.genericName} • {med.brand}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(med.sellingPrice)}</span>
                        {priceDiff !== 0 && (
                          <span className={`text-xs font-medium ${priceDiff < 0 ? "text-green-600" : "text-red-600"}`}>
                            {priceDiff < 0 ? "" : "+"}{formatCurrency(priceDiff)} vs current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge>{med.category}</Badge>
                        <span className="text-xs text-gray-400">{med.stock} in stock</span>
                      </div>
                    </div>
                    <Button size="sm" className="ml-3 shrink-0" onClick={() => { onSelect(med); onClose(); }}>
                      <Check size={13} />Select
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Keep Current</Button>
        </div>
      </div>
    </Modal>
  );
}
