"use client";

import { useState } from "react";
import {
  Plus, Search, ClipboardList, Truck, CheckCircle, XCircle,
  Eye, Trash2, PackageCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import StatCard from "@/components/ui/StatCard";
import { usePharmacyStore } from "@/store";
import { PurchaseOrder, PurchaseOrderItem, POStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const STATUS_VARIANT: Record<POStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  Draft: "default",
  Sent: "info",
  Confirmed: "warning",
  PartiallyReceived: "warning",
  Received: "success",
  Cancelled: "danger",
};

const EMPTY_ITEM: PurchaseOrderItem = {
  medicineId: "", medicineName: "", quantity: 1, unitPrice: 0,
  receivedQuantity: 0, total: 0,
};

export default function PurchaseOrdersPage() {
  const { purchaseOrders, suppliers, medicines, addPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = usePharmacyStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null);

  // ── New PO form state ──────────────────────────────────────────────────────
  const [poForm, setPOForm] = useState({
    supplierId: "",
    expectedDeliveryDate: "",
    notes: "",
    items: [{ ...EMPTY_ITEM }] as PurchaseOrderItem[],
  });

  const filtered = purchaseOrders.filter((po) => {
    const q = search.toLowerCase();
    const matchSearch = po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = {
    draft: purchaseOrders.filter((p) => p.status === "Draft").length,
    pending: purchaseOrders.filter((p) => ["Sent", "Confirmed"].includes(p.status)).length,
    received: purchaseOrders.filter((p) => p.status === "Received").length,
    total: purchaseOrders.reduce((s, p) => s + p.totalAmount, 0),
  };

  // ── PO Item helpers ──────────────────────────────────────────────────────
  const updateItem = (idx: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setPOForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[idx], [field]: value };
      if (field === "medicineId") {
        const med = medicines.find((m) => m.id === value);
        if (med) {
          item.medicineName = med.name;
          item.unitPrice = med.purchasePrice;
        }
      }
      item.total = item.quantity * item.unitPrice;
      items[idx] = item;
      return { ...prev, items };
    });
  };

  const addItem = () => setPOForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  const removeItem = (idx: number) => setPOForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const handleCreatePO = () => {
    if (!poForm.supplierId) { toast.error("Select a supplier"); return; }
    if (poForm.items.some((i) => !i.medicineId || i.quantity <= 0)) {
      toast.error("Fill all item details"); return;
    }
    const supplier = suppliers.find((s) => s.id === poForm.supplierId)!;
    const totalAmount = poForm.items.reduce((s, i) => s + i.total, 0);
    addPurchaseOrder({
      supplierId: poForm.supplierId,
      supplierName: supplier.name,
      items: poForm.items,
      poDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: poForm.expectedDeliveryDate || undefined,
      status: "Draft",
      totalAmount,
      notes: poForm.notes || undefined,
    });
    toast.success("Purchase order created");
    setShowForm(false);
    setPOForm({ supplierId: "", expectedDeliveryDate: "", notes: "", items: [{ ...EMPTY_ITEM }] });
  };

  // ── Receive goods ──────────────────────────────────────────────────────────
  const [receiveItems, setReceiveItems] = useState<PurchaseOrderItem[]>([]);
  const openReceive = (po: PurchaseOrder) => {
    setReceivePO(po);
    setReceiveItems(po.items.map((i) => ({ ...i, batchNumber: "", expiryDate: "", receivedQuantity: i.quantity })));
  };
  const handleReceive = () => {
    if (!receivePO) return;
    if (receiveItems.some((i) => !i.batchNumber || !i.expiryDate)) {
      toast.error("Enter batch number and expiry date for all items"); return;
    }
    receivePurchaseOrder(receivePO.id, receiveItems);
    toast.success(`PO ${receivePO.poNumber} received — stock updated`);
    setReceivePO(null);
  };

  const statusTabs: (POStatus | "All")[] = ["All", "Draft", "Sent", "Confirmed", "Received", "Cancelled"];

  return (
    <div>
      <Header title="Purchase Orders" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Draft" value={totals.draft} subtitle="pending review" icon={ClipboardList} iconColor="text-gray-500" iconBg="bg-gray-50" />
          <StatCard title="In Progress" value={totals.pending} subtitle="sent / confirmed" icon={Truck} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Received" value={totals.received} subtitle="completed" icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="Total Value" value={formatCurrency(totals.total)} subtitle="all orders" icon={PackageCheck} iconColor="text-purple-600" iconBg="bg-purple-50" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO number or supplier…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statusTabs.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}><Plus size={15} />New PO</Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["PO Number", "Supplier", "Items", "Total", "PO Date", "Expected", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center text-gray-400">
                  <ClipboardList size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />No purchase orders found
                </td></tr>
              ) : filtered.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{po.poNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{po.supplierName}</td>
                  <td className="px-4 py-3 text-gray-500">{po.items.length} item{po.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(po.totalAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(po.poDate)}</td>
                  <td className="px-4 py-3 text-gray-500">{po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : "—"}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[po.status]}>{po.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewPO(po)} title="View" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                      {po.status === "Draft" && (
                        <button onClick={() => { updatePurchaseOrder(po.id, { status: "Sent" }); toast.success("PO marked as Sent"); }}
                          title="Mark Sent" className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><Truck size={14} /></button>
                      )}
                      {(po.status === "Confirmed" || po.status === "Sent") && (
                        <button onClick={() => openReceive(po)} title="Receive Goods" className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg">
                          <PackageCheck size={14} /></button>
                      )}
                      {po.status === "Draft" && (
                        <button onClick={() => { deletePurchaseOrder(po.id); toast.success("PO deleted"); }}
                          title="Delete" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      )}
                      {!["Received", "Cancelled"].includes(po.status) && (
                        <button onClick={() => { updatePurchaseOrder(po.id, { status: "Cancelled" }); toast.success("PO cancelled"); }}
                          title="Cancel" className="p-1.5 text-gray-400 hover:bg-red-50 rounded-lg"><XCircle size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create PO Modal ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Purchase Order" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select value={poForm.supplierId} onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Input label="Expected Delivery" type="date" value={poForm.expectedDeliveryDate}
              onChange={(e) => setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })} />
          </div>
          <Input label="Notes" value={poForm.notes} onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })} placeholder="Optional notes" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Order Items</p>
              <Button size="sm" variant="outline" onClick={addItem}><Plus size={13} />Add Item</Button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  {["Medicine", "Qty", "Unit Price", "Total", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {poForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2">
                        <select value={item.medicineId} onChange={(e) => updateItem(idx, "medicineId", e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Select medicine</option>
                          {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                        className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                      <td className="px-2 py-2"><input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        className="w-24 rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                      <td className="px-3 py-2 font-medium text-gray-700">{formatCurrency(item.total)}</td>
                      <td className="px-2 py-2">
                        {poForm.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <p className="text-sm font-bold text-gray-900">
                Total: {formatCurrency(poForm.items.reduce((s, i) => s + i.total, 0))}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreatePO}>Create Purchase Order</Button>
          </div>
        </div>
      </Modal>

      {/* ── View PO Modal ── */}
      {viewPO && (
        <Modal isOpen={!!viewPO} onClose={() => setViewPO(null)} title={`PO: ${viewPO.poNumber}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Supplier:</span> <span className="font-medium">{viewPO.supplierName}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge variant={STATUS_VARIANT[viewPO.status]}>{viewPO.status}</Badge></div>
              <div><span className="text-gray-500">PO Date:</span> <span>{formatDate(viewPO.poDate)}</span></div>
              <div><span className="text-gray-500">Expected:</span> <span>{viewPO.expectedDeliveryDate ? formatDate(viewPO.expectedDeliveryDate) : "—"}</span></div>
              {viewPO.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span>{viewPO.notes}</span></div>}
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["Medicine", "Ordered", "Received", "Unit Price", "Total"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {viewPO.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{item.medicineName}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.receivedQuantity}</td>
                    <td className="px-3 py-2">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2 font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end font-bold text-gray-900">Total: {formatCurrency(viewPO.totalAmount)}</div>
          </div>
        </Modal>
      )}

      {/* ── Receive Goods Modal ── */}
      {receivePO && (
        <Modal isOpen={!!receivePO} onClose={() => setReceivePO(null)} title={`Receive Goods — ${receivePO.poNumber}`} size="xl">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Enter batch number and expiry date for each received item. Stock will be updated automatically.</p>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["Medicine", "Ordered", "Received Qty", "Batch No.", "Expiry Date"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {receiveItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-medium">{item.medicineName}</td>
                    <td className="px-3 py-2 text-gray-500">{item.quantity}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" min={0} max={item.quantity} value={item.receivedQuantity}
                        onChange={(e) => setReceiveItems((prev) => prev.map((i, n) => n === idx ? { ...i, receivedQuantity: Number(e.target.value) } : i))}
                        className="w-20 rounded border border-gray-200 px-2 py-1.5 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={item.batchNumber ?? ""} placeholder="BN2024001"
                        onChange={(e) => setReceiveItems((prev) => prev.map((i, n) => n === idx ? { ...i, batchNumber: e.target.value } : i))}
                        className="w-28 rounded border border-gray-200 px-2 py-1.5 text-sm" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="date" value={item.expiryDate ?? ""}
                        onChange={(e) => setReceiveItems((prev) => prev.map((i, n) => n === idx ? { ...i, expiryDate: e.target.value } : i))}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Button variant="outline" className="flex-1" onClick={() => setReceivePO(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleReceive}><PackageCheck size={15} />Receive & Update Stock</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
