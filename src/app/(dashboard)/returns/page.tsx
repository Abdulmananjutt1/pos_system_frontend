"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RotateCcw, Eye, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import { Sale, SaleReturn, ReturnItem, ReturnReason, ReturnCondition, PaymentMethod } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { returnService } from "@/services/returnService";
import { saleService } from "@/services/saleService";

const RETURN_REASONS: ReturnReason[] = ["Defective", "Expired", "Wrong Item", "Customer Request", "Other"];
const CONDITIONS: ReturnCondition[]  = ["Good", "Opened", "Damaged", "Expired"];

// Map frontend reason strings → backend enum values
const REASON_MAP: Record<string, string> = {
  "Defective":        "Defective",
  "Expired":          "Expired",
  "Wrong Item":       "WrongItem",
  "Customer Request": "CustomerRequest",
  "Other":            "Other",
};

const REASON_DISPLAY: Record<string, ReturnReason> = {
  WrongItem:       "Wrong Item",
  CustomerRequest: "Customer Request",
};

export default function ReturnsPage() {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [sales, setSales]     = useState<Sale[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [stats, setStats]     = useState({ total: 0, today: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedSale, setSelectedSale]       = useState<Sale | null>(null);
  const [viewReturn, setViewReturn]           = useState<SaleReturn | null>(null);
  const [submitting, setSubmitting]           = useState(false);

  // Return form
  const [returnItems, setReturnItems]   = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes]               = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [salesRes, returnsRes, statsRes] = await Promise.all([
        saleService.getAll({ status: "Completed", limit: 200 }),
        returnService.getAll({ limit: 200 }),
        returnService.getStats(),
      ]);
      setSales(salesRes.sales);
      setReturns(returnsRes.returns);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName ?? "").toLowerCase().includes(q)
    );
  });

  // ── Open return modal ──────────────────────────────────────────────────────
  const openReturn = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnItems(
      sale.items.map((item) => ({
        medicineId:     item.medicineId,
        medicineName:   item.medicineName,
        saleQuantity:   item.quantity,
        returnQuantity: 0,
        unitPrice:      item.unitPrice,
        reason:         "Customer Request" as ReturnReason,
        condition:      "Good" as ReturnCondition,
      }))
    );
    setNotes("");
    setRefundMethod((sale.paymentMethod as PaymentMethod) || "Cash");
    setShowReturnModal(true);
  };

  const updateReturnItem = <K extends keyof ReturnItem>(idx: number, field: K, value: ReturnItem[K]) => {
    setReturnItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const refundTotal = returnItems.reduce((s, i) => s + i.returnQuantity * i.unitPrice, 0);

  // ── Submit return ──────────────────────────────────────────────────────────
  const handleSubmitReturn = async () => {
    if (!selectedSale) return;
    const itemsToReturn = returnItems.filter((i) => i.returnQuantity > 0);
    if (!itemsToReturn.length) { toastApiError(new Error("Select at least one item to return")); return; }
    if (itemsToReturn.some((i) => i.returnQuantity > i.saleQuantity)) {
      toastApiError(new Error("Return quantity cannot exceed sold quantity")); return;
    }

    setSubmitting(true);
    try {
      const created = await returnService.create({
        saleId:       selectedSale.id,
        items:        itemsToReturn.map((i) => ({ ...i, reason: REASON_MAP[i.reason] ?? i.reason })),
        refundMethod,
        notes:        notes || undefined,
      });
      setReturns((prev) => [created, ...prev]);
      setSales((prev) => prev.filter((s) => s.id !== selectedSale.id));
      setStats((prev) => ({
        total:       prev.total + 1,
        today:       prev.today + 1,
        totalAmount: prev.totalAmount + refundTotal,
      }));
      toastSuccess(`Return processed — refund ${formatCurrency(refundTotal)}`);
      setShowReturnModal(false);
      setSelectedSale(null);
    } catch (err) {
      toastApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div><Header title="Returns & Refunds" />
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /><span>Loading returns…</span>
      </div>
    </div>
  );

  if (error) return (
    <div><Header title="Returns & Refunds" />
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Button onClick={fetchAll} variant="outline"><RefreshCw size={14} />Retry</Button>
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Returns & Refunds" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Returns"  value={stats.total}                    subtitle="all time"        icon={RotateCcw}  iconColor="text-orange-600" iconBg="bg-orange-50" />
          <StatCard title="Today's Returns" value={stats.today}                   subtitle="processed today" icon={AlertCircle} iconColor="text-red-600"    iconBg="bg-red-50"    />
          <StatCard title="Total Refunds"  value={formatCurrency(stats.totalAmount)} subtitle="refunded"     icon={RotateCcw}  iconColor="text-blue-600"   iconBg="bg-blue-50"   />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sales list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Select Invoice to Return</h2>
              <Button size="sm" variant="outline" onClick={fetchAll}><RefreshCw size={13} /></Button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice or customer…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredSales.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No completed sales found</p>
              ) : filteredSales.slice(0, 20).map((sale) => (
                <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-blue-200 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sale.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{sale.customerName ?? "Walk-in"} • {formatDate(sale.createdAt)}</p>
                    <p className="text-xs text-gray-400">{sale.items.length} item{sale.items.length !== 1 ? "s" : ""} • {sale.paymentMethod}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => openReturn(sale)}>
                      <RotateCcw size={12} />Return
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returns history */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Return History</h2>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {returns.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No returns yet</p>
              ) : returns.map((ret) => (
                <div key={ret.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ret.returnNumber}</p>
                    <p className="text-xs text-gray-500">Invoice: {ret.invoiceNumber} • {formatDate(ret.returnDate)}</p>
                    <p className="text-xs text-gray-400">{ret.items.length} item{ret.items.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-700">-{formatCurrency(ret.refundAmount)}</p>
                    <Badge variant="success" className="mt-1">{ret.status}</Badge>
                    <button onClick={() => setViewReturn(ret)} className="block mt-1 text-xs text-blue-500 hover:text-blue-700">
                      <Eye size={12} className="inline" /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Process Return Modal */}
      {selectedSale && (
        <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)}
          title={`Return — ${selectedSale.invoiceNumber}`} size="xl">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Set return quantity and condition. Items in <span className="font-medium text-green-700">Good</span> condition will be restocked automatically.
            </p>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["Medicine", "Sold", "Return Qty", "Reason", "Condition"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {returnItems.map((item, idx) => (
                  <tr key={idx} className={item.returnQuantity > 0 ? "bg-orange-50/30" : ""}>
                    <td className="px-3 py-2 font-medium text-gray-800">{item.medicineName}</td>
                    <td className="px-3 py-2 text-gray-500">{item.saleQuantity}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" min={0} max={item.saleQuantity} value={item.returnQuantity}
                        onChange={(e) => updateReturnItem(idx, "returnQuantity", Number(e.target.value))}
                        className="w-16 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={item.reason}
                        onChange={(e) => updateReturnItem(idx, "reason", e.target.value as ReturnReason)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none">
                        {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={item.condition}
                        onChange={(e) => updateReturnItem(idx, "condition", e.target.value as ReturnCondition)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none">
                        {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
                <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["Cash", "Card", "JazzCash", "EasyPaisa"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-sm text-gray-500">Refund Amount</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(refundTotal)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes about this return…" />
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Button variant="outline" className="flex-1" onClick={() => setShowReturnModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmitReturn} disabled={submitting || refundTotal === 0}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={15} />}
                Process Return
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Return Modal */}
      {viewReturn && (
        <Modal isOpen={!!viewReturn} onClose={() => setViewReturn(null)}
          title={`Return: ${viewReturn.returnNumber}`} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Invoice:</span> <span className="font-medium">{viewReturn.invoiceNumber}</span></div>
              <div><span className="text-gray-500">Date:</span> <span>{formatDate(viewReturn.returnDate)}</span></div>
              <div><span className="text-gray-500">Refund Method:</span> <span className="font-medium">{viewReturn.refundMethod}</span></div>
              <div><span className="text-gray-500">Refund Amount:</span> <span className="font-bold text-green-700">{formatCurrency(viewReturn.refundAmount)}</span></div>
            </div>
            {viewReturn.notes && <p className="text-gray-500 italic">{viewReturn.notes}</p>}
            <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["Medicine", "Sale Qty", "Returned", "Reason", "Condition"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {viewReturn.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium">{item.medicineName}</td>
                    <td className="px-3 py-2">{item.saleQuantity}</td>
                    <td className="px-3 py-2 font-semibold text-red-600">{item.returnQuantity}</td>
                    <td className="px-3 py-2">{REASON_DISPLAY[item.reason] ?? item.reason}</td>
                    <td className="px-3 py-2">
                      <Badge variant={item.condition === "Good" ? "success" : "warning"}>{item.condition}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
