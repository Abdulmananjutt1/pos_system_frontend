"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, ArrowLeftRight, PackageCheck, Clock,
  CheckCircle, Loader2, RefreshCw, ArrowUpFromLine, ArrowDownToLine,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import StatCard from "@/components/ui/StatCard";
import { StockTransfer, TransferStatus, TransferType, Medicine } from "@/types";
import { formatDate } from "@/lib/utils";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { stockTransferService } from "@/services/stockTransferService";
import { medicineService } from "@/services/medicineService";
import { authService } from "@/services/authService";

const STATUS_VARIANT: Record<TransferStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  Pending:   "warning",
  InTransit: "info",
  Received:  "success",
  Rejected:  "danger",
};

const TYPE_CONFIG: Record<TransferType, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  Internal:    { label: "Internal",      color: "text-blue-600 bg-blue-50 border-blue-200",   icon: ArrowLeftRight,   desc: "Between your own branches" },
  ExternalOut: { label: "Send Out",      color: "text-orange-600 bg-orange-50 border-orange-200", icon: ArrowUpFromLine, desc: "Send stock to another pharmacy" },
  ExternalIn:  { label: "Receive In",    color: "text-green-600 bg-green-50 border-green-200",  icon: ArrowDownToLine, desc: "Receive stock from another pharmacy" },
};

const BRANCHES = ["Main Branch", "Branch 2", "Branch 3"];
const EMPTY_ITEM = { medicineId: "", medicineName: "", quantity: 1 };

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<TransferType | "All">("All");
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [transferType, setTransferType] = useState<TransferType>("Internal");
  const [form, setForm] = useState({
    fromBranch:       BRANCHES[0],
    toBranch:         "",
    externalPharmacy: "",
    externalPhone:    "",
    notes:            "",
    items:            [{ ...EMPTY_ITEM }],
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [trResult, medResult] = await Promise.all([
        stockTransferService.getAll({ limit: 200 }),
        medicineService.getAll({ limit: 500 }),
      ]);
      setTransfers(trResult.transfers);
      setMedicines(medResult.medicines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = transfers.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.transferNumber.toLowerCase().includes(q) ||
      t.fromBranch.toLowerCase().includes(q) ||
      t.toBranch.toLowerCase().includes(q) ||
      (t.externalPharmacy ?? "").toLowerCase().includes(q);
    const matchType = typeFilter === "All" || t.transferType === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    pending:   transfers.filter((t) => t.status === "Pending").length,
    inTransit: transfers.filter((t) => t.status === "InTransit").length,
    received:  transfers.filter((t) => t.status === "Received").length,
  };

  // ── Item helpers ───────────────────────────────────────────────────────────
  const updateItem = (idx: number, field: string, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[idx], [field]: value };
      if (field === "medicineId") {
        const med = medicines.find((m) => m.id === value);
        if (med) item.medicineName = med.name;
      }
      items[idx] = item;
      return { ...prev, items };
    });
  };

  const resetForm = () => {
    setForm({ fromBranch: BRANCHES[0], toBranch: "", externalPharmacy: "", externalPhone: "", notes: "", items: [{ ...EMPTY_ITEM }] });
    setTransferType("Internal");
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    // Validation
    if (transferType === "Internal") {
      if (!form.toBranch) { toastApiError(new Error("Select destination branch")); return; }
      if (form.fromBranch === form.toBranch) { toastApiError(new Error("Source and destination cannot be the same")); return; }
    }
    if (transferType === "ExternalOut" || transferType === "ExternalIn") {
      if (!form.externalPharmacy.trim()) { toastApiError(new Error("Enter pharmacy name")); return; }
    }
    if (form.items.some((i) => !i.medicineId || i.quantity <= 0)) {
      toastApiError(new Error("Fill all item details")); return;
    }
    // Stock check for outgoing
    if (transferType !== "ExternalIn") {
      for (const item of form.items) {
        const med = medicines.find((m) => m.id === item.medicineId);
        if (med && item.quantity > med.stock) {
          toastApiError(new Error(`Insufficient stock for ${med.name} (available: ${med.stock})`)); return;
        }
      }
    }

    setSubmitting(true);
    try {
      const token = authService.getToken();
      let initiatedBy = "Admin";
      if (token) {
        try { initiatedBy = JSON.parse(atob(token.split(".")[1])).email ?? "Admin"; } catch { /**/ }
      }

      const fromBranch = transferType === "ExternalIn"
        ? (form.externalPharmacy || "External")
        : form.fromBranch;
      const toBranch = transferType === "ExternalOut"
        ? (form.externalPharmacy || "External")
        : transferType === "ExternalIn"
        ? form.fromBranch
        : form.toBranch;

      const created = await stockTransferService.create({
        transferType,
        fromBranch,
        toBranch,
        externalPharmacy: ["ExternalOut","ExternalIn"].includes(transferType) ? form.externalPharmacy : undefined,
        externalPhone:    form.externalPhone || undefined,
        notes:            form.notes || undefined,
        initiatedBy,
        items: form.items,
      });

      setTransfers((prev) => [created, ...prev]);

      // Update local stock
      if (transferType !== "ExternalIn") {
        setMedicines((prev) => prev.map((m) => {
          const item = form.items.find((i) => i.medicineId === m.id);
          return item ? { ...m, stock: Math.max(0, m.stock - item.quantity) } : m;
        }));
      } else {
        // ExternalIn → stock added
        setMedicines((prev) => prev.map((m) => {
          const item = form.items.find((i) => i.medicineId === m.id);
          return item ? { ...m, stock: m.stock + item.quantity } : m;
        }));
      }

      toastSuccess(
        transferType === "ExternalIn"
          ? "Stock received from external pharmacy"
          : "Transfer initiated"
      );
      setShowForm(false);
      resetForm();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (t: StockTransfer, status: TransferStatus) => {
    try {
      const updated = await stockTransferService.updateStatus(t.id, status);
      setTransfers((prev) => prev.map((x) => x.id === t.id ? updated : x));
      toastSuccess("Status updated");
    } catch (err) { toastApiError(err); }
  };

  const handleReceive = async (t: StockTransfer) => {
    try {
      const updated = await stockTransferService.receive(t.id);
      setTransfers((prev) => prev.map((x) => x.id === t.id ? updated : x));
      setMedicines((prev) => prev.map((m) => {
        const item = t.items.find((i) => i.medicineId === m.id);
        return item ? { ...m, stock: m.stock + item.quantity } : m;
      }));
      toastSuccess("Transfer received — stock updated");
    } catch (err) { toastApiError(err); }
  };

  if (loading) return (
    <div><Header title="Stock Transfers" />
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /><span>Loading transfers…</span>
      </div>
    </div>
  );

  if (error) return (
    <div><Header title="Stock Transfers" />
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Button onClick={fetchAll} variant="outline"><RefreshCw size={14} />Retry</Button>
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Stock Transfers" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Pending"    value={stats.pending}   subtitle="awaiting dispatch" icon={Clock}          iconColor="text-yellow-600" iconBg="bg-yellow-50" />
          <StatCard title="In Transit" value={stats.inTransit} subtitle="on the way"        icon={ArrowLeftRight} iconColor="text-blue-600"   iconBg="bg-blue-50"   />
          <StatCard title="Received"   value={stats.received}  subtitle="completed"          icon={CheckCircle}   iconColor="text-green-600"  iconBg="bg-green-50"  />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transfers…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
            {(["All", "Internal", "ExternalOut", "ExternalIn"] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  typeFilter === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}>
                {t === "All" ? "All" : TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={fetchAll}><RefreshCw size={14} /></Button>
            <Button onClick={() => setShowForm(true)}><Plus size={15} />New Transfer</Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Transfer #", "Type", "From", "To", "Items", "Date", "By", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-14 text-center text-gray-400">
                  <ArrowLeftRight size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                  No transfers found
                </td></tr>
              ) : filtered.map((t) => {
                const cfg = TYPE_CONFIG[t.transferType];
                const Icon = cfg.icon;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{t.transferNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${cfg.color}`}>
                        <Icon size={11} />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{t.fromBranch}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[120px] truncate">{t.toBranch}</td>
                    <td className="px-4 py-3 text-gray-500">{t.items.length} item{t.items.length !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.transferDate)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[100px] truncate">{t.initiatedBy}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.status === "Pending" && t.transferType !== "ExternalIn" && (
                          <button onClick={() => handleStatusUpdate(t, "InTransit")}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
                            Dispatch
                          </button>
                        )}
                        {t.status === "InTransit" && (
                          <button onClick={() => handleReceive(t)}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1">
                            <PackageCheck size={11} />Receive
                          </button>
                        )}
                        {!["Received", "Rejected"].includes(t.status) && (
                          <button onClick={() => handleStatusUpdate(t, "Rejected")}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} of {transfers.length} transfers
            </div>
          )}
        </div>
      </div>

      {/* ── New Transfer Modal ── */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="New Stock Transfer" size="xl">
        <div className="space-y-5">

          {/* Transfer Type Selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Transfer Type *</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(TYPE_CONFIG) as [TransferType, typeof TYPE_CONFIG[TransferType]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} onClick={() => setTransferType(key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      transferType === key
                        ? `${cfg.color} border-current shadow-sm`
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}>
                    <Icon size={18} />
                    <span className="text-xs font-semibold">{cfg.label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{cfg.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch / Pharmacy fields */}
          {transferType === "Internal" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Branch *</label>
                <select value={form.fromBranch} onChange={(e) => setForm({ ...form, fromBranch: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Branch *</label>
                <select value={form.toBranch} onChange={(e) => setForm({ ...form, toBranch: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Select destination —</option>
                  {BRANCHES.filter((b) => b !== form.fromBranch).map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          {transferType === "ExternalOut" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Branch *</label>
                  <select value={form.fromBranch} onChange={(e) => setForm({ ...form, fromBranch: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <Input label="Receiving Pharmacy Name *" value={form.externalPharmacy}
                  onChange={(e) => setForm({ ...form, externalPharmacy: e.target.value })}
                  placeholder="e.g. City Pharmacy" />
              </div>
              <Input label="Pharmacy Phone (optional)" value={form.externalPhone}
                onChange={(e) => setForm({ ...form, externalPhone: e.target.value })}
                placeholder="03XX-XXXXXXX" />
            </div>
          )}

          {transferType === "ExternalIn" && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                Stock will be added to your inventory immediately upon saving.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Sending Pharmacy Name *" value={form.externalPharmacy}
                  onChange={(e) => setForm({ ...form, externalPharmacy: e.target.value })}
                  placeholder="e.g. Al-Shifa Pharmacy" />
                <Input label="Pharmacy Phone (optional)" value={form.externalPhone}
                  onChange={(e) => setForm({ ...form, externalPhone: e.target.value })}
                  placeholder="03XX-XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receive Into Branch *</label>
                <select value={form.fromBranch} onChange={(e) => setForm({ ...form, fromBranch: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                {transferType === "ExternalIn" ? "Items Received" : "Items to Transfer"}
              </p>
              <Button size="sm" variant="outline"
                onClick={() => setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))}>
                <Plus size={13} />Add Item
              </Button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  {["Medicine", transferType === "ExternalIn" ? "Your Stock" : "Available", "Qty", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {form.items.map((item, idx) => {
                    const med = medicines.find((m) => m.id === item.medicineId);
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-2">
                          <select value={item.medicineId} onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">Select medicine</option>
                            {medicines
                              .filter((m) => transferType === "ExternalIn" ? true : m.stock > 0)
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.stock} {m.unit}s)
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-medium">
                          {med ? <span className={med.stock === 0 ? "text-red-500" : ""}>{med.stock}</span> : "—"}
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min={1} value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                            className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none" />
                        </td>
                        <td className="px-2 py-2">
                          {form.items.length > 1 && (
                            <button onClick={() => setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                              className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes…" />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={submitting}>
              {submitting
                ? <Loader2 size={14} className="animate-spin" />
                : transferType === "ExternalIn"
                  ? <ArrowDownToLine size={14} />
                  : <ArrowLeftRight size={14} />}
              {transferType === "ExternalIn" ? "Receive Stock" : "Initiate Transfer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
