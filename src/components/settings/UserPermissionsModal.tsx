"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { PERMISSIONS } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

interface DBUser {
  id:          string;
  name:        string;
  email:       string;
  role:        string;
  isActive:    boolean;
  permissions: string[];
}

const PERMISSION_GROUPS = [
  {
    group: "Point of Sale",
    items: [
      { key: PERMISSIONS.SALES_CREATE, label: "Create sales" },
      { key: PERMISSIONS.SALES_VIEW,   label: "View sale history" },
      { key: PERMISSIONS.SALES_REFUND, label: "Process refunds" },
    ],
  },
  {
    group: "Inventory & Medicines",
    items: [
      { key: PERMISSIONS.MEDICINES_READ,   label: "View medicines" },
      { key: PERMISSIONS.MEDICINES_WRITE,  label: "Add/Edit/Delete medicines" },
      { key: PERMISSIONS.INVENTORY_VIEW,   label: "View inventory" },
      { key: PERMISSIONS.INVENTORY_ADJUST, label: "Adjust stock" },
    ],
  },
  {
    group: "Customers & Suppliers",
    items: [
      { key: PERMISSIONS.CUSTOMERS_READ,  label: "View customers" },
      { key: PERMISSIONS.CUSTOMERS_WRITE, label: "Edit/Delete customers" },
      { key: PERMISSIONS.SUPPLIERS_READ,  label: "View suppliers" },
      { key: PERMISSIONS.SUPPLIERS_WRITE, label: "Edit/Delete suppliers" },
    ],
  },
  {
    group: "Orders & Transfers",
    items: [
      { key: PERMISSIONS.PURCHASE_ORDERS_READ,  label: "View purchase orders" },
      { key: PERMISSIONS.PURCHASE_ORDERS_WRITE, label: "Create/manage purchase orders" },
      { key: PERMISSIONS.TRANSFERS_READ,        label: "View stock transfers" },
      { key: PERMISSIONS.TRANSFERS_WRITE,       label: "Create stock transfers" },
    ],
  },
  {
    group: "Returns & Reports",
    items: [
      { key: PERMISSIONS.RETURNS_READ,   label: "View returns" },
      { key: PERMISSIONS.RETURNS_CREATE, label: "Process returns" },
      { key: PERMISSIONS.REPORTS_VIEW,   label: "View reports" },
    ],
  },
  {
    group: "Admin",
    items: [
      { key: PERMISSIONS.SETTINGS_VIEW,    label: "View settings" },
      { key: PERMISSIONS.SETTINGS_WRITE,   label: "Edit settings" },
      { key: PERMISSIONS.STOCK_COUNT_VIEW, label: "View stock counts" },
      { key: PERMISSIONS.STOCK_COUNT_MANAGE, label: "Manage stock counts" },
      { key: PERMISSIONS.LOGIN_HISTORY_VIEW, label: "View login history" },
      { key: PERMISSIONS.DASHBOARD_VIEW,   label: "View dashboard" },
    ],
  },
];

interface Props {
  user: DBUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (user: DBUser) => void;
}

export default function UserPermissionsModal({ user, isOpen, onClose, onUpdated }: Props) {
  const [selected, setSelected] = useState<string[]>(user.permissions);
  const [saving, setSaving]     = useState(false);

  const toggle = (perm: string) => {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiPatch<DBUser>(`/auth/users/${user.id}/permissions`, { permissions: selected });
      onUpdated(updated);
      toastSuccess("Permissions updated");
      onClose();
    } catch (err) {
      toastApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (user.role === "admin") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Permissions — ${user.name}`} size="md">
        <div className="text-center py-8 text-gray-500">
          <p className="font-medium">Admin has all permissions</p>
          <p className="text-sm text-gray-400 mt-1">Admin role cannot be restricted</p>
          <Button className="mt-4" onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions — ${user.name}`} size="lg">
      <div className="space-y-5">
        <p className="text-sm text-gray-500">
          Select what <span className="font-semibold text-gray-800">{user.name}</span> ({user.role}) can access.
        </p>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {PERMISSION_GROUPS.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{group}</p>
              <div className="space-y-1.5">
                {items.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)}
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400 font-mono ml-auto">{key}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Standalone Users + Permissions page component (for settings) ──────────────
export function UsersPermissionsPanel() {
  const [users, setUsers]           = useState<DBUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedUser, setSelected] = useState<DBUser | null>(null);

  useState(() => {
    apiGet<DBUser[]>("/auth/users")
      .then(setUsers)
      .catch(toastApiError)
      .finally(() => setLoading(false));
  });

  const handleUpdated = (updated: DBUser) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
  };

  if (loading) return <div className="py-8 text-center text-gray-400">Loading users…</div>;

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
          <div>
            <p className="font-semibold text-gray-800">{u.name}</p>
            <p className="text-xs text-gray-400">{u.email}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {u.role}
              </span>
              {u.role !== "admin" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {u.permissions.length} permissions
                </span>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setSelected(u)}
            disabled={u.role === "admin"}>
            {u.role === "admin" ? "All Access" : "Edit Permissions"}
          </Button>
        </div>
      ))}

      {selectedUser && (
        <UserPermissionsModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
