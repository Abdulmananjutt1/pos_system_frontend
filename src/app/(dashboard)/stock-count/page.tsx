"use client";

import { useState } from "react";
import {
  ClipboardCheck, Plus, Printer, CheckCircle, Search, AlertTriangle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { usePharmacyStore } from "@/store";
import { StockCount } from "@/types";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function StockCountPage() {
  const { stockCounts, startStockCount, updateStockCountItem, finalizeStockCount, deleteStockCount } = usePharmacyStore();

  const [activeCount, setActiveCount] = useState<StockCount | null>(null);
  const [search, setSearch] = useState("");

  const currentCounts = usePharmacyStore((s) => s.stockCounts);

  const handleStart = () => {
    const count = startStockCount();
    setActiveCount(count);
    toast.success(`Stock count ${count.countNumber} started`);
  };

  const handleFinalize = () => {
    if (!activeCount) return;
    finalizeStockCount(activeCount.id);
    toast.success("Stock count finalized — inventory adjusted");
    setActiveCount(null);
  };

  const handlePrintSheet = () => {
    if (!activeCount) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    const rows = activeCount.items.map((item) =>
      `<tr><td>${item.medicineName}</td><td>${item.batchNumber}</td><td style="text-align:center">${item.systemStock}</td><td style="text-align:center; border: 1px solid #999; min-width:60px">&nbsp;</td></tr>`
    ).join("");
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Stock Count Sheet</title>
      <style>body{font-family:sans-serif;font-size:12px;padding:20px}
      table{width:100%;border-collapse:collapse}th{background:#eee;padding:6px;text-align:left;border:1px solid #ccc}
      td{padding:6px;border-bottom:1px solid #eee}h2{margin-bottom:4px}p{color:#666;font-size:11px}
      </style></head><body>
      <h2>Stock Count Sheet — ${activeCount.countNumber}</h2>
      <p>Date: ${activeCount.countDate} | Total items: ${activeCount.items.length}</p>
      <br/><table><thead><tr><th>Medicine Name</th><th>Batch</th><th>System Stock</th><th>Physical Count</th></tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  // Filtered items for active count
  const filteredItems = activeCount
    ? activeCount.items.filter((i) => i.medicineName.toLowerCase().includes(search.toLowerCase()))
    : [];

  const countedItems = activeCount?.items.filter((i) => i.physicalCount !== null).length ?? 0;
  const discrepancies = activeCount?.items.filter((i) => i.physicalCount !== null && i.variance !== 0).length ?? 0;

  return (
    <div>
      <Header title="Physical Stock Count" />
      <div className="p-6 space-y-6">

        {!activeCount ? (
          <>
            {/* History */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Stock Count History</h2>
                <p className="text-sm text-gray-500 mt-0.5">{stockCounts.length} count{stockCounts.length !== 1 ? "s" : ""} total</p>
              </div>
              <Button onClick={handleStart}><Plus size={15} />Start New Count</Button>
            </div>

            {stockCounts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
                <ClipboardCheck size={40} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                <p className="text-gray-500 font-medium">No stock counts yet</p>
                <p className="text-sm text-gray-400 mt-1">Start a count to reconcile your physical inventory</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    {["Count #", "Date", "Total Items", "Counted", "Discrepancies", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockCounts.map((count) => {
                      const counted = count.items.filter((i) => i.physicalCount !== null).length;
                      const disc = count.items.filter((i) => i.physicalCount !== null && i.variance !== 0).length;
                      return (
                        <tr key={count.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{count.countNumber}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(count.countDate)}</td>
                          <td className="px-4 py-3 text-gray-500">{count.items.length}</td>
                          <td className="px-4 py-3 text-gray-500">{counted}</td>
                          <td className="px-4 py-3">
                            {disc > 0 ? <span className="text-red-600 font-semibold">{disc}</span> : <span className="text-gray-400">0</span>}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={count.status === "Verified" ? "success" : count.status === "InProgress" ? "warning" : "default"}>
                              {count.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {count.status === "InProgress" && (
                                <button onClick={() => setActiveCount(count)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Resume</button>
                              )}
                              <button onClick={() => { deleteStockCount(count.id); toast.success("Count deleted"); }}
                                className="text-xs text-red-400 hover:text-red-600">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Active count UI */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Count: {activeCount.countNumber}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {countedItems} / {activeCount.items.length} counted
                  {discrepancies > 0 && <span className="ml-2 text-red-600 font-medium flex items-center gap-1 inline-flex"><AlertTriangle size={12} />{discrepancies} discrepancies</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintSheet}><Printer size={14} />Print Sheet</Button>
                <Button variant="outline" size="sm" onClick={() => setActiveCount(null)}>Save & Exit</Button>
                <Button size="sm" onClick={handleFinalize}><CheckCircle size={14} />Finalize & Adjust</Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>{Math.round((countedItems / activeCount.items.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(countedItems / activeCount.items.length) * 100}%` }} />
              </div>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  {["Medicine", "Batch", "System Stock", "Physical Count", "Variance", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.medicineId} className={`hover:bg-gray-50 ${item.physicalCount !== null && item.variance !== 0 ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.medicineName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.batchNumber}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{item.systemStock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={item.physicalCount ?? ""}
                          placeholder="Enter qty"
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : Number(e.target.value);
                            updateStockCountItem(activeCount.id, item.medicineId, val as number);
                            // Keep local state in sync
                            setActiveCount((prev) => prev ? {
                              ...prev,
                              items: prev.items.map((i) =>
                                i.medicineId === item.medicineId
                                  ? { ...i, physicalCount: val, variance: val !== null ? val - i.systemStock : 0 }
                                  : i
                              ),
                            } : prev);
                          }}
                          className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.physicalCount !== null ? (
                          <span className={`font-semibold ${item.variance > 0 ? "text-green-600" : item.variance < 0 ? "text-red-600" : "text-gray-400"}`}>
                            {item.variance > 0 ? "+" : ""}{item.variance}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.physicalCount === null ? (
                          <Badge>Pending</Badge>
                        ) : item.variance === 0 ? (
                          <Badge variant="success">Match</Badge>
                        ) : item.variance > 0 ? (
                          <Badge variant="info">Over</Badge>
                        ) : (
                          <Badge variant="danger">Short</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
