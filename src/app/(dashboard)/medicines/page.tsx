"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, PackagePlus, Pill, ArrowUpDown,
  Upload, Barcode, TrendingDown, Download, RefreshCw, Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import ExpiryBadge from "@/components/inventory/ExpiryBadge";
import StockBar from "@/components/inventory/StockBar";
import MedicineFormModal from "@/components/inventory/MedicineFormModal";
import StockAdjustModal from "@/components/inventory/StockAdjustModal";
import BarcodeLabelModal from "@/components/inventory/BarcodeLabelModal";
import BulkImportModal from "@/components/inventory/BulkImportModal";
import { usePharmacyStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import { useReorderSuggestions } from "@/hooks/useReorderSuggestions";
import { Medicine, Supplier } from "@/types";
import { medicineService } from "@/services/medicineService";
import { supplierService } from "@/services/supplierService";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { MEDICINE_CATEGORIES } from "@/lib/constants";

type CategoryFilter = Medicine["category"] | "All";
type SortKey = "name" | "stock" | "price" | "expiry";
type SortDir = "asc" | "desc";
type ActiveTab = "catalogue" | "reorder";

export default function MedicinesPage() {
  const { sales } = usePharmacyStore();

  // ── API State ─────────────────────────────────────────────────────────────
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeTab, setActiveTab] = useState<ActiveTab>("catalogue");

  const [formOpen, setFormOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [adjustingMed, setAdjustingMed] = useState<Medicine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Medicine | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  // ── Fetch medicines from API ───────────────────────────────────────────────
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [medResult, supResult] = await Promise.all([
        medicineService.getAll({ limit: 500 }),
        supplierService.getAll(),
      ]);
      setMedicines(medResult.medicines);
      setSuppliers(supResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const alerts = useInventoryAlerts(medicines, now);
  const reorderSuggestions = useReorderSuggestions(medicines, sales, now);

  // ── Filter + Search ───────────────────────────────────────────────────────
  const afterFilter = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.batchNumber.toLowerCase().includes(q);
    const matchCat =
      categoryFilter === "All" || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...afterFilter].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "stock") cmp = a.stock - b.stock;
    else if (sortKey === "price") cmp = a.sellingPrice - b.sellingPrice;
    else if (sortKey === "expiry")
      cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = () => { setEditingMed(null); setFormOpen(true); };
  const handleEdit = (m: Medicine) => { setEditingMed(m); setFormOpen(true); };

  const handleFormSubmit = async (
    data: Omit<Medicine, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (editingMed) {
        const updated = await medicineService.update(editingMed.id, data);
        setMedicines((prev) => prev.map((m) => m.id === editingMed.id ? updated : m));
        toastSuccess("Medicine updated");
      } else {
        const created = await medicineService.create(data);
        setMedicines((prev) => [created, ...prev]);
        toastSuccess("Medicine created");
      }
      setFormOpen(false);
    } catch (err) {
      toastApiError(err);
    }
  };

  const handleDelete = async (med: Medicine) => {
    try {
      await medicineService.delete(med.id);
      setMedicines((prev) => prev.filter((m) => m.id !== med.id));
      toastSuccess("Medicine deleted");
      setDeleteConfirm(null);
    } catch (err) {
      toastApiError(err);
    }
  };

  const handleAdjust = async (medicineId: string, adjustment: number) => {
    try {
      const updated = await medicineService.adjustStock(medicineId, adjustment);
      setMedicines((prev) => prev.map((m) => m.id === medicineId ? updated : m));
      toastSuccess("Stock adjusted");
      setAdjustingMed(null);
    } catch (err) {
      toastApiError(err);
    }
  };

  const handleBulkImport = async (imported: Omit<Medicine, "id" | "createdAt" | "updatedAt">[]) => {
    try {
      const results = await Promise.all(imported.map((m) => medicineService.create(m)));
      setMedicines((prev) => [...results, ...prev]);
      toastSuccess(`${imported.length} medicines imported`);
    } catch (err) {
      toastApiError(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ["name","genericName","brand","category","unit","batchNumber","expiryDate","purchasePrice","sellingPrice","stock","minStock","requiresPrescription"];
    const rows = medicines.map((m) => headers.map((h) => {
      const val = (m as unknown as Record<string, unknown>)[h];
      return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "");
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medicines_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toastSuccess(`${medicines.length} medicines exported`);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Header title="Medicines" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64 text-gray-400">
            <Loader2 size={32} className="animate-spin mr-3" />
            <span className="text-lg">Loading medicines…</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <Header title="Medicines" />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
            <p className="text-red-500 font-medium">Error: {error}</p>
            <Button onClick={fetchMedicines} variant="outline">
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Medicines" />

      <div className="p-6 space-y-6">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Medicines"
            value={medicines.length}
            subtitle="in catalogue"
            icon={Pill}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Out of Stock"
            value={alerts.outOfStock.length}
            subtitle="need restocking"
            icon={PackagePlus}
            iconColor={alerts.outOfStock.length > 0 ? "text-red-600" : "text-gray-400"}
            iconBg={alerts.outOfStock.length > 0 ? "bg-red-50" : "bg-gray-50"}
          />
          <StatCard
            title="Low Stock"
            value={alerts.lowStock.length}
            subtitle="below minimum"
            icon={PackagePlus}
            iconColor={alerts.lowStock.length > 0 ? "text-yellow-600" : "text-gray-400"}
            iconBg={alerts.lowStock.length > 0 ? "bg-yellow-50" : "bg-gray-50"}
          />
          <StatCard
            title="Expiry Issues"
            value={alerts.expired.length + alerts.expiringSoon.length}
            subtitle="expired or expiring"
            icon={Pill}
            iconColor={
              alerts.expired.length + alerts.expiringSoon.length > 0
                ? "text-orange-600"
                : "text-gray-400"
            }
            iconBg={
              alerts.expired.length + alerts.expiringSoon.length > 0
                ? "bg-orange-50"
                : "bg-gray-50"
            }
          />
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 min-w-0">
            {/* Search */}
            <div className="relative min-w-0 w-full sm:max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setCategoryFilter("All")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  categoryFilter === "All"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                All
              </button>
              {MEDICINE_CATEGORIES.map((cat) => {
                const count = medicines.filter((m) => m.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      categoryFilter === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={fetchMedicines} title="Refresh">
              <RefreshCw size={14} />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowBarcodeModal(true)}>
              <Barcode size={14} />Labels
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download size={14} />Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload size={14} />Import
            </Button>
            <Button onClick={handleAdd} className="shrink-0">
              <Plus size={16} />Add Medicine
            </Button>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-gray-200">
          <button onClick={() => setActiveTab("catalogue")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "catalogue" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            Medicine Catalogue
          </button>
          <button onClick={() => setActiveTab("reorder")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "reorder" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <TrendingDown size={14} />Reorder Suggestions
            {reorderSuggestions.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{reorderSuggestions.length}</span>
            )}
          </button>
        </div>

        {/* ── Reorder Suggestions Panel ─────────────────────────────────── */}
        {activeTab === "reorder" && (
          <div className="space-y-3">
            {reorderSuggestions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <RefreshCw size={32} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                <p className="text-gray-500 font-medium">No reorder suggestions</p>
                <p className="text-sm text-gray-400 mt-1">All medicines are adequately stocked</p>
              </div>
            ) : reorderSuggestions.map((sug) => (
              <div key={sug.medicine.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${sug.priority === "Critical" ? "border-red-200 bg-red-50/30" : sug.priority === "High" ? "border-yellow-200 bg-yellow-50/30" : "border-blue-200 bg-blue-50/30"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{sug.medicine.name}</p>
                    <Badge variant={sug.priority === "Critical" ? "danger" : sug.priority === "High" ? "warning" : "info"}>{sug.priority}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{sug.medicine.genericName} • {sug.medicine.brand}</p>
                  <p className="text-xs text-gray-500 mt-1">{sug.reason}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div><span className="text-xs text-gray-400">Current: </span><span className={`text-sm font-bold ${sug.currentStock === 0 ? "text-red-600" : "text-yellow-600"}`}>{sug.currentStock}</span></div>
                  <div><span className="text-xs text-gray-400">Order: </span><span className="text-sm font-bold text-blue-600">{sug.suggestedQty}</span></div>
                  {sug.avgDailySales !== undefined && sug.avgDailySales > 0 && (
                    <div className="text-xs text-gray-400">{sug.avgDailySales.toFixed(1)}/day avg</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        {activeTab === "catalogue" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <SortTh label="Medicine" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Batch / Expiry</th>
                  <SortTh label="Stock" sortKey="stock" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortTh label="Price" sortKey="price" current={sortKey} dir={sortDir} onClick={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-gray-400">
                      <Pill size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  sorted.map((med) => (
                    <MedicineRow
                      key={med.id}
                      medicine={med}
                      now={now}
                      onEdit={handleEdit}
                      onDelete={setDeleteConfirm}
                      onAdjust={setAdjustingMed}
                    />
                  ))
                )}
              </tbody>
            </table>

            {sorted.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {sorted.length} of {medicines.length} medicines
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <MedicineFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        medicine={editingMed}
        suppliers={suppliers}
      />

      <StockAdjustModal
        medicine={adjustingMed}
        isOpen={!!adjustingMed}
        onClose={() => setAdjustingMed(null)}
        onAdjust={handleAdjust}
      />

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Medicine?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {deleteConfirm.name}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleDelete(deleteConfirm)}
              >
                <Trash2 size={15} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Labels */}
      <BarcodeLabelModal isOpen={showBarcodeModal} onClose={() => setShowBarcodeModal(false)} medicines={medicines} />

      {/* Bulk Import */}
      <BulkImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleBulkImport} />
    </div>
  );
}

// ── Medicine Row ──────────────────────────────────────────────────────────────
interface MedicineRowProps {
  medicine: Medicine;
  now: Date | null;
  onEdit: (m: Medicine) => void;
  onDelete: (m: Medicine) => void;
  onAdjust: (m: Medicine) => void;
}

function MedicineRow({ medicine: med, now, onEdit, onDelete, onAdjust }: MedicineRowProps) {
  const isOut = med.stock === 0;
  const isLow = !isOut && med.stock <= med.minStock;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Name */}
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900">{med.name}</span>
            {med.requiresPrescription && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                Rx
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{med.genericName}</p>
          <p className="text-xs text-gray-400">{med.brand}</p>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Badge>{med.category}</Badge>
        <p className="text-xs text-gray-400 mt-1">{med.unit}</p>
      </td>

      {/* Batch / Expiry */}
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-gray-700 font-medium">{med.batchNumber}</p>
        {now ? (
          <div className="mt-1">
            <ExpiryBadge expiryDate={med.expiryDate} now={now} />
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(med.expiryDate).toLocaleDateString("en-PK")}
            </p>
          </div>
        ) : null}
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <div className="min-w-[90px]">
          <span className={`font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-gray-900"}`}>
            {med.stock}
            <span className="text-xs font-normal text-gray-400 ml-1">{med.unit}s</span>
          </span>
          <StockBar stock={med.stock} minStock={med.minStock} className="mt-1.5 w-16" />
          <p className="text-[10px] text-gray-400 mt-0.5">min {med.minStock}</p>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="font-semibold text-gray-900">{formatCurrency(med.sellingPrice)}</p>
        <p className="text-xs text-gray-400">Cost: {formatCurrency(med.purchasePrice)}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {isOut ? (
          <Badge variant="danger">Out of Stock</Badge>
        ) : isLow ? (
          <Badge variant="warning">Low Stock</Badge>
        ) : (
          <Badge variant="success">In Stock</Badge>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAdjust(med)}
            title="Adjust stock"
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <PackagePlus size={14} />
          </button>
          <button
            onClick={() => onEdit(med)}
            title="Edit medicine"
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(med)}
            title="Delete medicine"
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Sortable header ───────────────────────────────────────────────────────────
interface SortThProps {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}

function SortTh({ label, sortKey, current, dir, onClick }: SortThProps) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-blue-600 select-none"
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={active ? "text-blue-500" : "text-gray-300"} />
        {active && (
          <span className="text-[10px] text-blue-500">{dir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );
}
