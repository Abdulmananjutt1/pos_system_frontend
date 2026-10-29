"use client";

import { useState, useEffect, useCallback } from "react";
import { Banknote, Clock, CheckCircle, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { cashShiftService, CashShift } from "@/services/cashShiftService";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { saleService } from "@/services/saleService";

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "open" | "close" | "summary";
}

export default function CashShiftModal({ isOpen, onClose, mode }: CashShiftModalProps) {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [amount, setAmount]             = useState("");
  const [notes, setNotes]               = useState("");
  const [cashSales, setCashSales]       = useState(0);
  const [entryType, setEntryType]       = useState<"in" | "out">("in");
  const [entryDesc, setEntryDesc]       = useState("");
  const [entryAmount, setEntryAmount]   = useState("");
  const [tab, setTab]                   = useState<"summary" | "entries">("summary");

  // Load current shift when modal opens
  const loadShift = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const shift = await cashShiftService.getCurrent();
      setCurrentShift(shift);

      // Load cash sales since shift opened
      if (shift) {
        const salesRes = await saleService.getAll({ limit: 500 });
        const shiftCashSales = salesRes.sales
          .filter((s) => s.paymentMethod === "Cash" && s.status === "Completed" &&
            new Date(s.createdAt) >= new Date(shift.openTime))
          .reduce((sum, s) => sum + s.total, 0);
        setCashSales(shiftCashSales);
      }
    } catch (err) {
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => { loadShift(); }, [loadShift]);

  // ── Open shift ─────────────────────────────────────────────────────────────
  const handleOpen = async () => {
    const bal = Number(amount);
    if (!amount || bal < 0) return;
    setSubmitting(true);
    try {
      const shift = await cashShiftService.open(bal);
      setCurrentShift(shift);
      setAmount("");
      toastSuccess("Shift opened");
      onClose();
    } catch (err) { toastApiError(err); }
    finally { setSubmitting(false); }
  };

  // ── Close shift ────────────────────────────────────────────────────────────
  const handleClose = async () => {
    if (!currentShift) return;
    const bal = Number(amount);
    if (!amount || bal < 0) return;
    setSubmitting(true);
    try {
      await cashShiftService.close(currentShift.id, bal, notes || undefined);
      setCurrentShift(null);
      setAmount(""); setNotes("");
      toastSuccess("Shift closed");
      onClose();
    } catch (err) { toastApiError(err); }
    finally { setSubmitting(false); }
  };

  // ── Add cash entry ─────────────────────────────────────────────────────────
  const handleAddEntry = async () => {
    if (!currentShift || !entryDesc || !entryAmount) return;
    setSubmitting(true);
    try {
      const entry = await cashShiftService.addEntry(currentShift.id, entryDesc, Number(entryAmount), entryType);
      setCurrentShift((prev) => prev ? { ...prev, entries: [...prev.entries, entry] } : prev);
      setEntryDesc(""); setEntryAmount("");
      toastSuccess("Entry added");
    } catch (err) { toastApiError(err); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cash Shift" size="sm">
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />Loading…
        </div>
      </Modal>
    );
  }

  // ── Open shift modal ───────────────────────────────────────────────────────
  if (mode === "open" && !currentShift) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Open Cash Drawer" size="sm">
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <Banknote size={28} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-800">Enter the opening cash balance</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Balance (PKR)</label>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000" autoFocus
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleOpen} disabled={submitting}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
              Open Shift
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (mode === "open" && currentShift) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Shift Already Open" size="sm">
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-gray-600">A shift is already open since</p>
          <p className="font-semibold text-gray-800">{new Date(currentShift.openTime).toLocaleString("en-PK")}</p>
          <Button className="w-full" onClick={onClose}>OK</Button>
        </div>
      </Modal>
    );
  }

  // ── Close shift modal ──────────────────────────────────────────────────────
  if (mode === "close" && currentShift) {
    const cashIns  = currentShift.entries.filter((e) => e.type === "in").reduce((s, e)  => s + e.amount, 0);
    const cashOuts = currentShift.entries.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);
    const expectedCash = currentShift.openingBalance + cashSales + cashIns - cashOuts;

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Close Cash Drawer" size="sm">
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            {[
              { label: "Opening Balance", value: formatCurrency(currentShift.openingBalance) },
              { label: "Cash Sales",      value: formatCurrency(cashSales),      color: "text-blue-600" },
              { label: "Cash In",         value: formatCurrency(cashIns),        color: "text-green-600" },
              { label: "Cash Out",        value: formatCurrency(cashOuts),       color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium ${color ?? "text-gray-800"}`}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Expected Cash</span>
              <span>{formatCurrency(expectedCash)}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Closing Balance (PKR)</label>
            <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={`Expected: ${formatCurrency(expectedCash)}`} autoFocus
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {amount && (
              <p className={`text-xs mt-1 font-medium ${Number(amount) - expectedCash < 0 ? "text-red-600" : "text-green-600"}`}>
                Variance: {formatCurrency(Number(amount) - expectedCash)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End of shift notes…" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleClose} disabled={submitting || !amount}>
              {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
              Close Shift
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Summary modal ──────────────────────────────────────────────────────────
  if (mode === "summary" && currentShift) {
    const cashIns  = currentShift.entries.filter((e) => e.type === "in").reduce((s, e)  => s + e.amount, 0);
    const cashOuts = currentShift.entries.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);
    const openTime = new Date(currentShift.openTime);

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Current Shift" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Opened: {openTime.toLocaleDateString("en-PK", { day: "numeric", month: "short" })} {openTime.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="text-xs text-gray-400">by {currentShift.openedBy}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Cash Sales",      value: formatCurrency(cashSales),                     sub: "cash only" },
              { label: "Opening Balance", value: formatCurrency(currentShift.openingBalance),   sub: "opening" },
              { label: "Cash In",         value: formatCurrency(cashIns),                       sub: "entries" },
              { label: "Cash Out",        value: formatCurrency(cashOuts),                      sub: "entries" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {(["summary", "entries"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium capitalize transition-colors ${tab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>
                {t === "summary" ? "Breakdown" : "Cash In/Out"}
              </button>
            ))}
          </div>

          {tab === "summary" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash</span>
                <span className="font-medium text-gray-800">{formatCurrency(cashSales)}</span>
              </div>
              {cashIns > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cash In (entries)</span>
                  <span className="font-medium text-green-600">{formatCurrency(cashIns)}</span>
                </div>
              )}
              {cashOuts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cash Out (entries)</span>
                  <span className="font-medium text-red-600">{formatCurrency(cashOuts)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-100">
                <span>Expected in Drawer</span>
                <span>{formatCurrency(currentShift.openingBalance + cashSales + cashIns - cashOuts)}</span>
              </div>
            </div>
          )}

          {tab === "entries" && (
            <div className="space-y-3">
              {currentShift.entries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No cash entries yet</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {currentShift.entries.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{e.description}</span>
                      <span className={e.type === "in" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {e.type === "in" ? "+" : "-"}{formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Add entry */}
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Add Entry</p>
                <div className="flex gap-1">
                  {(["in", "out"] as const).map((t) => (
                    <button key={t} onClick={() => setEntryType(t)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border font-medium capitalize transition-colors ${entryType === t ? (t === "in" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600") : "bg-white text-gray-600 border-gray-200"}`}>
                      {t === "in" ? "Cash In" : "Cash Out"}
                    </button>
                  ))}
                </div>
                <input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Description"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <input type="number" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="Amount"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <Button size="sm" onClick={handleAddEntry} disabled={submitting}>
                    <CheckCircle size={13} />Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return null;
}
