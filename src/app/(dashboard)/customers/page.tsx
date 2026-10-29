"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, RefreshCw, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Customer } from "@/types";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { customerService } from "@/services/customerService";

const EMPTY_FORM = { name: "", phone: "", email: "", address: "" };

export default function CustomersPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await customerService.getAll({ limit: 500 });
      setCustomers(result.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingId(null); setForm(EMPTY_FORM); setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "", address: c.address ?? "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await customerService.update(editingId, form);
        setCustomers((prev) => prev.map((c) => c.id === editingId ? updated : c));
        toastSuccess("Customer updated");
      } else {
        const created = await customerService.create(form);
        setCustomers((prev) => [created, ...prev]);
        toastSuccess("Customer added");
      }
      setIsModalOpen(false);
    } catch (err) {
      toastApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    try {
      await customerService.delete(c.id);
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      toastSuccess("Customer deleted");
      setDeleteConfirm(null);
    } catch (err) {
      toastApiError(err);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div><Header title="Customers" />
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /><span>Loading customers…</span>
      </div>
    </div>
  );

  if (error) return (
    <div><Header title="Customers" />
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <Button onClick={fetchCustomers} variant="outline"><RefreshCw size={14} />Retry</Button>
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Customers" />
      <div className="p-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, phone or email…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCustomers}><RefreshCw size={14} /></Button>
            <Button onClick={handleOpenAdd}><Plus size={16} />Add Customer</Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Name", "Phone", "Email", "Address", "Total Purchases", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                    No customers found
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.address || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(c.totalPurchases)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} of {customers.length} customers
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone Number *" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required placeholder="03XX-XXXXXXX" />
          <Input label="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {editingId ? "Update" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">{deleteConfirm.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={15} />Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
