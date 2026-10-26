"use client";

import { useState } from "react";
import { Plus, Search, ArrowLeftRight, PackageCheck, Clock, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import StatCard from "@/components/ui/StatCard";
import { usePharmacyStore } from "@/store";
import { StockTransferItem, TransferStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_VARIANT: Record<TransferStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  Pending: "warning",
  InTransit: "info",
  Received: "success",
  Rejected: "danger",
};

const EMPTY_ITEM: StockTransferItem = { medicineId: "", medicineName: "", quantity: 1 };

export default function TransfersPage() {
  const { stockTransfers, medicines, settings, addStockTransfer, updateTransferStatus, receiveStockTransfer, currentUser } = usePharmacyStore();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fromBranch: settings.currentBranch,
    toBranch: "",
    notes: "",
    items: [{ ...EMPTY_ITEM }] as StockTransferItem[],
  });

  const branches = settings.branches.length > 0 ? settings.branches : ["Main Branch", "Branch 2"];

  const filtered = stockTransfers.filter((t) => {
    const q = search.toLowerCase();
    return t.transferNumber.toLowerCase().includes(q) || t.fromBranch.toLowerCase().includes(q) || t.toBranch.toLowerCase().includes(q);
  });

  const stats = {
    pending: stockTransfers.filter((t) => t.status === "Pending").length,
    inTransit: stockTransfers.filter((t) => t.status === "InTransit").length,
    received: stockTransfers.filter((t) => t.status === "Received").length,
  };

  const updateItem = (idx: number, field: keyof StockTransferItem, value: string | number) => {
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

  const handleCreate = () => {
    if (!form.toBranch) { toast.error("Select destination branch"); return; }
    if (form.fromBranch === form.toBranch) { toast.error("Source and destination cannot be the same"); return; }
    if (form.items.some((i) => !i.medicineId || i.quantity <= 0)) { toast.error("Fill all item details"); return; }
    // Check stock availability
    for (const item of form.items) {
      const med = medicines.find((m) => m.id === item.medicineId);
      if (med && item.quantity > med.stock) { toast.error(`Insufficient stock for ${med.name}`); return; }
    }
    addStockTransfer({
      fromBranch: form.fromBranch,
      toBranch: form.toBranch,
      items: form.items,
      transferDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      notes: form.notes || undefined,
      initiatedBy: currentUser?.name ?? "Admin",
    });
    toast.success("Transfer initiated — stock deducted from source");
    setShowForm(false);
    setForm({ fromBranch: settings.currentBranch, toBranch: "", notes: "", items: [{ ...EMPTY_ITEM }] });
  };

  return (
    <div>
      <Header title="Inter-Branch Transfers" />
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Pending" value={stats.pending} subtitle="awaiting dispatch" icon={Clock} iconColor="text-yellow-600" iconBg="bg-yellow-50" />
          <StatCard title="In Transit" value={stats.inTransit} subtitle="on the way" icon={ArrowLeftRight} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Received" value={stats.received} subtitle="completed" icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transfers…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
          <Button onClick={() => setShowForm(true)}><Plus size={15} />New Transfer</Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Transfer #", "From", "To", "Items", "Date", "Initiated By", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                  <ArrowLeftRight size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />No transfers found
                </td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{t.transferNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{t.fromBranch}</td>
                  <td className="px-4 py-3 text-gray-700">{t.toBranch}</td>
                  <td className="px-4 py-3 text-gray-500">{t.items.length} item{t.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(t.transferDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{t.initiatedBy}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.status === "Pending" && (
                        <button onClick={() => { updateTransferStatus(t.id, "InTransit"); toast.success("Marked In Transit"); }}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">Dispatch</button>
                      )}
                      {t.status === "InTransit" && (
                        <button onClick={() => { receiveStockTransfer(t.id); toast.success("Transfer received — stock updated"); }}
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1">
                          <PackageCheck size={11} />Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Transfer Modal ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Stock Transfer" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Branch *</label>
              <select value={form.fromBranch} onChange={(e) => setForm({ ...form, fromBranch: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {branches.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Branch *</label>
              <select value={form.toBranch} onChange={(e) => setForm({ ...form, toBranch: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select destination —</option>
                {branches.filter((b) => b !== form.fromBranch).map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Items to Transfer</p>
              <Button size="sm" variant="outline" onClick={() => setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }))}>
                <Plus size={13} />Add Item
              </Button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  {["Medicine", "Available Stock", "Transfer Qty", ""].map((h) => (
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
                            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm">
                            <option value="">Select medicine</option>
                            {medicines.filter((m) => m.stock > 0).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{med ? med.stock : "—"}</td>
                        <td className="px-2 py-2">
                          <input type="number" min={1} max={med?.stock} value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                            className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional transfer notes…" />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate}><ArrowLeftRight size={15} />Initiate Transfer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
