"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Package,
  TrendingUp,
  ArrowUpDown,
  PackagePlus,
  Filter,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/inventory/AlertBanner";
import StockBar from "@/components/inventory/StockBar";
import ExpiryBadge from "@/components/inventory/ExpiryBadge";
import StockAdjustModal from "@/components/inventory/StockAdjustModal";
import { usePharmacyStore } from "@/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import { Medicine } from "@/types";
import toast from "react-hot-toast";

// ── Filter types ──────────────────────────────────────────────────────────────
type FilterKey = "all" | "out-of-stock" | "low-stock" | "expiring" | "expired";
type SortKey = "name" | "stock" | "expiry" | "value";
type SortDir = "asc" | "desc";

export default function InventoryPage() {
  const { medicines, suppliers, adjustStock } = usePharmacyStore();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [adjustingMed, setAdjustingMed] = useState<Medicine | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const alerts = useInventoryAlerts(medicines, now);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalValue = medicines.reduce(
    (sum, m) => sum + m.stock * m.purchasePrice,
    0
  );
  const totalRetailValue = medicines.reduce(
    (sum, m) => sum + m.stock * m.sellingPrice,
    0
  );
  const totalUnits = medicines.reduce((sum, m) => sum + m.stock, 0);

  // ── Filter ────────────────────────────────────────────────────────────────
  const afterFilter = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.batchNumber.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (!now) return filter === "all";

    switch (filter) {
      case "out-of-stock":
        return m.stock === 0;
      case "low-stock":
        return m.stock > 0 && m.stock <= m.minStock;
      case "expiring":
        return (
          !isExpiredDate(m.expiryDate, now) && isExpiringSoonDate(m.expiryDate, now)
        );
      case "expired":
        return isExpiredDate(m.expiryDate, now);
      default:
        return true;
    }
  });

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = [...afterFilter].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "stock") cmp = a.stock - b.stock;
    else if (sortKey === "expiry")
      cmp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    else if (sortKey === "value")
      cmp = a.stock * a.purchasePrice - b.stock * b.purchasePrice;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleAdjust = (medicineId: string, adjustment: number) => {
    adjustStock(medicineId, adjustment);
    const med = medicines.find((m) => m.id === medicineId);
    if (med) {
      const newQty = Math.max(0, med.stock + adjustment);
      toast.success(`Stock updated: ${med.name} → ${newQty} ${med.unit}s`);
    }
  };

  const supplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name ?? "—";

  // ── Filter tabs ───────────────────────────────────────────────────────────
  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: medicines.length },
    { key: "out-of-stock", label: "Out of Stock", count: alerts.outOfStock.length },
    { key: "low-stock", label: "Low Stock", count: alerts.lowStock.length },
    { key: "expiring", label: "Expiring Soon", count: alerts.expiringSoon.length },
    { key: "expired", label: "Expired", count: alerts.expired.length },
  ];

  return (
    <div>
      <Header title="Inventory" />

      <div className="p-6 space-y-6">
        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Medicines"
            value={medicines.length}
            subtitle={`${totalUnits.toLocaleString()} total units`}
            icon={Package}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Inventory Cost"
            value={formatCurrency(totalValue)}
            subtitle="at purchase price"
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Retail Value"
            value={formatCurrency(totalRetailValue)}
            subtitle="at selling price"
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Stock Alerts"
            value={alerts.totalAlerts}
            subtitle="items need attention"
            icon={Filter}
            iconColor={alerts.totalAlerts > 0 ? "text-red-600" : "text-gray-400"}
            iconBg={alerts.totalAlerts > 0 ? "bg-red-50" : "bg-gray-50"}
          />
        </div>

        {/* ── Alert banners ──────────────────────────────────────────────── */}
        <AlertBanner
          alerts={alerts}
          onFilterClick={(key) => setFilter(key as FilterKey)}
        />

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand, batch…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {filterTabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filter === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {label}
                {count > 0 && key !== "all" && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      filter === key
                        ? "bg-white/30 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <SortTh
                  label="Medicine"
                  sortKey="name"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Batch / Supplier
                </th>
                <SortTh
                  label="Stock"
                  sortKey="stock"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortTh
                  label="Value"
                  sortKey="value"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortTh
                  label="Expiry"
                  sortKey="expiry"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-gray-400"
                  >
                    <Package
                      size={32}
                      className="mx-auto mb-2 text-gray-300"
                      strokeWidth={1.5}
                    />
                    No medicines match the current filter
                  </td>
                </tr>
              ) : (
                sorted.map((med) => (
                  <InventoryRow
                    key={med.id}
                    medicine={med}
                    now={now}
                    supplierName={supplierName(med.supplierId)}
                    onAdjust={() => setAdjustingMed(med)}
                  />
                ))
              )}
            </tbody>
          </table>

          {/* Footer count */}
          {sorted.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {sorted.length} of {medicines.length} medicines
            </div>
          )}
        </div>
      </div>

      {/* ── Stock Adjust Modal ─────────────────────────────────────────────── */}
      <StockAdjustModal
        medicine={adjustingMed}
        isOpen={!!adjustingMed}
        onClose={() => setAdjustingMed(null)}
        onAdjust={handleAdjust}
      />
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
interface InventoryRowProps {
  medicine: Medicine;
  now: Date | null;
  supplierName: string;
  onAdjust: () => void;
}

function InventoryRow({
  medicine: med,
  now,
  supplierName,
  onAdjust,
}: InventoryRowProps) {
  const stockValue = med.stock * med.purchasePrice;
  const isOut = med.stock === 0;
  const isLow = !isOut && med.stock <= med.minStock;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {/* Medicine name */}
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              {med.name}
            </span>
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
      </td>

      {/* Batch / Supplier */}
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-gray-700">{med.batchNumber}</p>
        <p className="text-xs text-gray-400 mt-0.5">{supplierName}</p>
      </td>

      {/* Stock */}
      <td className="px-4 py-3">
        <div className="min-w-[100px]">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-bold text-sm ${
                isOut
                  ? "text-red-600"
                  : isLow
                  ? "text-yellow-600"
                  : "text-gray-900"
              }`}
            >
              {med.stock}
            </span>
            <span className="text-xs text-gray-400">{med.unit}s</span>
          </div>
          <StockBar
            stock={med.stock}
            minStock={med.minStock}
            className="mt-1.5 w-20"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">
            min {med.minStock}
          </p>
        </div>
      </td>

      {/* Value */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="font-medium text-gray-800">{formatCurrency(stockValue)}</p>
        <p className="text-xs text-gray-400">
          {formatCurrency(med.purchasePrice)} / {med.unit.toLowerCase()}
        </p>
      </td>

      {/* Expiry */}
      <td className="px-4 py-3 whitespace-nowrap">
        {now ? (
          <>
            <ExpiryBadge expiryDate={med.expiryDate} now={now} />
            <p className="text-xs text-gray-400 mt-1">{formatDate(med.expiryDate)}</p>
          </>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Status badges */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {isOut && <Badge variant="danger">Out of Stock</Badge>}
          {isLow && !isOut && <Badge variant="warning">Low Stock</Badge>}
          {!isOut && !isLow && now && !isExpiredDate(med.expiryDate, now) && !isExpiringSoonDate(med.expiryDate, now) && (
            <Badge variant="success">OK</Badge>
          )}
        </div>
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onAdjust}
          className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
        >
          <PackagePlus size={13} />
          Adjust
        </Button>
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
  onClick: (key: SortKey) => void;
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
        <ArrowUpDown
          size={12}
          className={active ? "text-blue-500" : "text-gray-300"}
        />
        {active && (
          <span className="text-[10px] text-blue-500">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

// ── Local date helpers (avoid import cycle) ───────────────────────────────────
function isExpiredDate(expiryDate: string, now: Date) {
  return new Date(expiryDate) < now;
}
function isExpiringSoonDate(expiryDate: string, now: Date) {
  const expiry = new Date(expiryDate);
  const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30 && diff >= 0;
}
