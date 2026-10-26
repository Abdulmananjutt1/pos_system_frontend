"use client";

import { useState, useRef } from "react";
import { Printer, Barcode, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Medicine } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
}

export default function BarcodeLabelModal({ isOpen, onClose, medicines }: BarcodeLabelModalProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev[id]) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: string, qty: number) => setSelected((prev) => ({ ...prev, [id]: Math.max(1, qty) }));

  const selectedList = Object.entries(selected).map(([id, qty]) => ({ med: medicines.find((m) => m.id === id)!, qty })).filter((e) => e.med);

  // Simple barcode pattern (just visual bars, not scannable — real usage would use jsbarcode)
  const renderBarcode = (id: string) => {
    const chars = id.split("").map((c) => c.charCodeAt(0));
    const bars = chars.map((code) => {
      const pattern = (code % 4) + 1;
      return `<div style="display:inline-flex;gap:1px">${Array.from({ length: 8 }).map((_, i) =>
        `<div style="width:${(i % pattern === 0 ? 2 : 1)}px;height:30px;background:#000;display:inline-block"></div>`
      ).join("")}</div>`;
    }).join("");
    return bars;
  };

  const handlePrint = () => {
    const labels = selectedList.flatMap(({ med, qty }) =>
      Array.from({ length: qty }).map(() => `
        <div style="width:80mm;border:1px solid #ccc;padding:4px;margin:4px;display:inline-block;vertical-align:top;font-family:monospace">
          <div style="font-size:10px;font-weight:bold;margin-bottom:2px;overflow:hidden;white-space:nowrap">${med.name}</div>
          <div style="font-size:8px;color:#555">${med.genericName}</div>
          <div style="margin:4px 0;overflow:hidden">${renderBarcode(med.id)}</div>
          <div style="font-size:8px;font-family:monospace;text-align:center">${med.id}</div>
          <div style="display:flex;justify-content:space-between;font-size:9px;margin-top:2px">
            <span>MRP: <b>${formatCurrency(med.sellingPrice)}</b></span>
            <span>Exp: ${med.expiryDate}</span>
          </div>
        </div>
      `)
    ).join("");

    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Barcode Labels</title>
      <style>body{margin:0;padding:8px}@media print{body{margin:0}}</style>
      </head><body>${labels}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Barcode Labels" size="xl">
      <div className="flex gap-4" style={{ minHeight: "400px" }}>
        {/* Left: medicine list */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {filtered.map((med) => (
              <div key={med.id} onClick={() => toggle(med.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selected[med.id] ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <input type="checkbox" checked={!!selected[med.id]} readOnly className="accent-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{med.name}</p>
                  <p className="text-xs text-gray-400 truncate">{med.genericName}</p>
                </div>
                <span className="text-xs font-medium text-gray-700 shrink-0">{formatCurrency(med.sellingPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: selected with qty */}
        <div className="w-56 shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            To Print ({selectedList.length})
          </p>
          {selectedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <Barcode size={28} strokeWidth={1.5} />
              <p className="text-xs mt-2">Select medicines</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedList.map(({ med, qty }) => (
                <div key={med.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <p className="flex-1 text-xs font-medium text-gray-700 truncate">{med.name}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setQty(med.id, qty - 1); }}
                      className="w-5 h-5 rounded bg-white border border-gray-200 text-xs hover:bg-gray-100 flex items-center justify-center">−</button>
                    <span className="w-6 text-center text-xs font-medium">{qty}</span>
                    <button onClick={(e) => { e.stopPropagation(); setQty(med.id, qty + 1); }}
                      className="w-5 h-5 rounded bg-white border border-gray-200 text-xs hover:bg-gray-100 flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={handlePrint} disabled={selectedList.length === 0}>
          <Printer size={15} />Print {selectedList.reduce((s, e) => s + e.qty, 0)} Label{selectedList.reduce((s, e) => s + e.qty, 0) !== 1 ? "s" : ""}
        </Button>
      </div>
    </Modal>
  );
}
