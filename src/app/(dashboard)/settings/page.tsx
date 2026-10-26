"use client";

import { useState, useEffect } from "react";
import {
  Store, Receipt, Shield, Palette, Trash2, Plus, Check, Users, Pencil,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { usePharmacyStore } from "@/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ThemeColor, User, UserRole } from "@/types";
import { THEMES } from "@/lib/themes";
import toast from "react-hot-toast";

type SettingsTab = "pharmacy" | "pos" | "permissions" | "appearance" | "expenses" | "users";

const ROLES: UserRole[] = ["Admin", "Manager", "Cashier", "Pharmacist"];

const EMPTY_USER = { username: "", name: "", email: "", role: "Cashier" as UserRole, pin: "", isActive: true, branch: "Main Branch" };

export default function SettingsPage() {
  const { settings, updateSettings, expenses, addExpense, deleteExpense, users, addUser, updateUser, deleteUser } = usePharmacyStore();

  const [tab, setTab] = useState<SettingsTab>("pharmacy");
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);

  // Local copies so we can edit and save atomically
  const [pharForm, setPharForm] = useState({
    pharmacyName: settings.pharmacyName,
    address: settings.address,
    phone: settings.phone,
    licenseNumber: settings.licenseNumber ?? "",
    taxNumber: settings.taxNumber ?? "",
    footerText: settings.footerText ?? "",
  });

  const [posForm, setPosForm] = useState({
    taxRate: String(settings.taxRate * 100),
    invoicePrefix: settings.invoicePrefix,
    currency: settings.currency,
    lowStockThreshold: String(settings.lowStockThreshold),
    expiryWarnDays: String(settings.expiryWarnDays ?? 90),
    autoLogoutMinutes: String(settings.autoLogoutMinutes ?? 30),
    receiptTemplate: settings.receiptTemplate,
  });

  const [permForm, setPermForm] = useState({
    allowLineDiscount: settings.allowLineDiscount,
    allowBillDiscount: settings.allowBillDiscount,
    allowSplitPayment: settings.allowSplitPayment,
    allowHoldSale: settings.allowHoldSale,
    allowCreditSales: settings.allowCreditSales ?? true,
    requireRxUpload: settings.requireRxUpload ?? false,
  });

  // Keep local in sync if store changes externally
  useEffect(() => {
    setPharForm({
      pharmacyName: settings.pharmacyName,
      address: settings.address,
      phone: settings.phone,
      licenseNumber: settings.licenseNumber ?? "",
      taxNumber: settings.taxNumber ?? "",
      footerText: settings.footerText ?? "",
    });
    setPosForm({
      taxRate: String(settings.taxRate * 100),
      invoicePrefix: settings.invoicePrefix,
      currency: settings.currency,
      lowStockThreshold: String(settings.lowStockThreshold),
      expiryWarnDays: String(settings.expiryWarnDays ?? 90),
      autoLogoutMinutes: String(settings.autoLogoutMinutes ?? 30),
      receiptTemplate: settings.receiptTemplate,
    });
    setPermForm({
      allowLineDiscount: settings.allowLineDiscount,
      allowBillDiscount: settings.allowBillDiscount,
      allowSplitPayment: settings.allowSplitPayment,
      allowHoldSale: settings.allowHoldSale,
      allowCreditSales: settings.allowCreditSales ?? true,
      requireRxUpload: settings.requireRxUpload ?? false,
    });
  }, [settings]);

  // Expense form — date seeded in useEffect to avoid prerender new Date() error
  const [expForm, setExpForm] = useState({ description: "", amount: "", category: "Utilities", date: "" });
  const [invoiceDateStr, setInvoiceDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setExpForm((prev) => ({ ...prev, date: todayISO }));
    setInvoiceDateStr(`${yy}${mm}${dd}`);
  }, []);

  const savePharForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharForm.pharmacyName.trim()) { toast.error("Pharmacy name required"); return; }
    updateSettings({
      pharmacyName: pharForm.pharmacyName,
      address: pharForm.address,
      phone: pharForm.phone,
      licenseNumber: pharForm.licenseNumber || undefined,
      taxNumber: pharForm.taxNumber || undefined,
      footerText: pharForm.footerText || undefined,
    });
    toast.success("Pharmacy info saved");
  };

  const savePosForm = (e: React.FormEvent) => {
    e.preventDefault();
    const taxRate = Math.max(0, Math.min(100, Number(posForm.taxRate))) / 100;
    const lowStockThreshold = Math.max(1, Number(posForm.lowStockThreshold));
    const expiryWarnDays = Math.max(1, Number(posForm.expiryWarnDays));
    const autoLogoutMinutes = Math.max(1, Number(posForm.autoLogoutMinutes));
    if (!posForm.invoicePrefix.trim()) { toast.error("Invoice prefix required"); return; }
    updateSettings({
      taxRate,
      invoicePrefix: posForm.invoicePrefix.trim().toUpperCase(),
      currency: posForm.currency,
      lowStockThreshold,
      expiryWarnDays,
      autoLogoutMinutes,
      receiptTemplate: posForm.receiptTemplate,
    });
    toast.success("POS settings saved");
  };

  const savePermForm = () => {
    updateSettings(permForm);
    toast.success("Permissions saved");
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description || !expForm.amount) { toast.error("Fill in all required fields"); return; }
    addExpense({
      description: expForm.description,
      amount: Number(expForm.amount),
      category: expForm.category,
      date: expForm.date,
    });
    toast.success("Expense added");
    setExpForm({ description: "", amount: "", category: "Utilities", date: new Date().toISOString().split("T")[0] });
  };

  const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: "pharmacy",    label: "Pharmacy Info",  icon: Store    },
    { key: "pos",         label: "POS & Billing",  icon: Receipt  },
    { key: "permissions", label: "Permissions",    icon: Shield   },
    { key: "appearance",  label: "Appearance",     icon: Palette  },
    { key: "expenses",    label: "Expenses",       icon: Trash2   },
    { key: "users",       label: "User Management",icon: Users    },
  ];

  // ── User form handlers ─────────────────────────────────────────────────────
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm(EMPTY_USER);
    setUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ username: u.username, name: u.name, email: u.email, role: u.role, pin: u.pin ?? "", isActive: u.isActive, branch: u.branch ?? "Main Branch" });
    setUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.name || !userForm.email) { toast.error("Fill in all required fields"); return; }
    if (userForm.pin && (userForm.pin.length !== 4 || !/^\d+$/.test(userForm.pin))) { toast.error("PIN must be exactly 4 digits"); return; }
    if (editingUser) {
      updateUser(editingUser.id, { ...userForm, pin: userForm.pin || undefined });
      toast.success("User updated");
    } else {
      addUser({ ...userForm, pin: userForm.pin || undefined });
      toast.success("User added");
    }
    setUserModal(false);
  };

  const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div>
      <Header title="Settings" />

      <div className="p-6 flex gap-6">
        {/* ── Sidebar tabs ──────────────────────────────────────────────── */}
        <div className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  tab === key
                    ? "theme-tab-active"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>

          {/* About card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between"><span>App</span><span className="font-medium">PharmaPOS</span></div>
              <div className="flex justify-between"><span>Version</span><span className="font-medium">2.0.0</span></div>
              <div className="flex justify-between"><span>Stack</span><span className="font-medium">Next.js 16</span></div>
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 max-w-2xl space-y-6">

          {/* ── Pharmacy Info ── */}
          {tab === "pharmacy" && (
            <Card>
              <CardHeader
                title="Pharmacy Information"
                subtitle="Shown on invoices and receipts"
              />
              <form onSubmit={savePharForm} className="space-y-4">
                <Input
                  label="Pharmacy Name *"
                  value={pharForm.pharmacyName}
                  onChange={(e) => setPharForm({ ...pharForm, pharmacyName: e.target.value })}
                  placeholder="e.g. Al-Shifa Pharmacy"
                />
                <Input
                  label="Address"
                  value={pharForm.address}
                  onChange={(e) => setPharForm({ ...pharForm, address: e.target.value })}
                  placeholder="Full address"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    value={pharForm.phone}
                    onChange={(e) => setPharForm({ ...pharForm, phone: e.target.value })}
                    placeholder="021-XXXXXXXX"
                  />
                  <Input
                    label="License Number"
                    value={pharForm.licenseNumber}
                    onChange={(e) => setPharForm({ ...pharForm, licenseNumber: e.target.value })}
                    placeholder="DL-XXXX"
                  />
                  <Input
                    label="Tax / NTN Number"
                    value={pharForm.taxNumber}
                    onChange={(e) => setPharForm({ ...pharForm, taxNumber: e.target.value })}
                    placeholder="NTN-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Text</label>
                  <textarea
                    value={pharForm.footerText}
                    onChange={(e) => setPharForm({ ...pharForm, footerText: e.target.value })}
                    rows={2}
                    placeholder="Thank you for your purchase!"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── POS & Billing ── */}
          {tab === "pos" && (
            <Card>
              <CardHeader
                title="POS & Billing Settings"
                subtitle="Configure tax, invoice numbering and receipts"
              />
              <form onSubmit={savePosForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={posForm.taxRate}
                    onChange={(e) => setPosForm({ ...posForm, taxRate: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Invoice Prefix"
                    value={posForm.invoicePrefix}
                    onChange={(e) => setPosForm({ ...posForm, invoicePrefix: e.target.value })}
                    placeholder="INV"
                  />
                  <Input
                    label="Currency"
                    value={posForm.currency}
                    onChange={(e) => setPosForm({ ...posForm, currency: e.target.value })}
                    placeholder="PKR"
                  />
                  <Input
                    label="Low Stock Threshold"
                    type="number"
                    min={1}
                    value={posForm.lowStockThreshold}
                    onChange={(e) => setPosForm({ ...posForm, lowStockThreshold: e.target.value })}
                    placeholder="10"
                  />
                  <Input
                    label="Expiry Warning (days)"
                    type="number"
                    min={1}
                    value={posForm.expiryWarnDays}
                    onChange={(e) => setPosForm({ ...posForm, expiryWarnDays: e.target.value })}
                    placeholder="90"
                  />
                  <Input
                    label="Auto Logout (minutes)"
                    type="number"
                    min={1}
                    value={posForm.autoLogoutMinutes}
                    onChange={(e) => setPosForm({ ...posForm, autoLogoutMinutes: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Receipt Template</label>
                  <div className="flex gap-3">
                    {(["thermal", "a4"] as const).map((t) => (
                      <label
                        key={t}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                          posForm.receiptTemplate === t
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="receiptTemplate"
                          value={t}
                          checked={posForm.receiptTemplate === t}
                          onChange={() => setPosForm({ ...posForm, receiptTemplate: t })}
                          className="accent-blue-600"
                        />
                        <span className="text-sm font-medium capitalize">{t === "thermal" ? "Thermal (80mm)" : "A4 Paper"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preview: invoice number */}
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
                  Preview: <span className="font-bold text-gray-800">
                    {posForm.invoicePrefix || "INV"}-{invoiceDateStr}-1234
                  </span>
                </div>

                <div className="pt-2">
                  <Button type="submit">Save POS Settings</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Permissions ── */}
          {tab === "permissions" && (
            <Card>
              <CardHeader
                title="POS Permissions"
                subtitle="Control what cashiers can do at the till"
              />
              <div className="space-y-4">
                {[
                  {
                    key: "allowLineDiscount" as const,
                    label: "Line-level Discount",
                    desc: "Allow cashier to apply a discount on individual cart items",
                  },
                  {
                    key: "allowBillDiscount" as const,
                    label: "Bill-level Discount",
                    desc: "Allow cashier to apply a single discount on the whole bill",
                  },
                  {
                    key: "allowSplitPayment" as const,
                    label: "Split Payment",
                    desc: "Allow payment across multiple methods (e.g. Cash + Card)",
                  },
                  {
                    key: "allowHoldSale" as const,
                    label: "Hold / Resume Sale",
                    desc: "Allow cashier to pause an in-progress sale and resume later",
                  },
                  {
                    key: "allowCreditSales" as const,
                    label: "Credit Sales (Udhaar)",
                    desc: "Allow sales on credit — customer pays later",
                  },
                  {
                    key: "requireRxUpload" as const,
                    label: "Require Rx Upload",
                    desc: "Mandate prescription image upload for Rx and controlled items",
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => setPermForm((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                        permForm[key] ? "theme-btn-primary" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={permForm[key]}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          permForm[key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="pt-2">
                  <Button onClick={savePermForm}>Save Permissions</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Appearance ── */}
          {tab === "appearance" && (
            <Card>
              <CardHeader
                title="Appearance"
                subtitle="Pick a colour theme for the entire app"
              />

              <div className="space-y-6">
                {/* Theme grid */}
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(({ key, label, swatch }) => {
                    const isActive = settings.themeColor === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          updateSettings({ themeColor: key });
                          toast.success(`Theme changed to ${label}`);
                        }}
                        className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                          isActive
                            ? "border-gray-400 bg-gray-50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                        aria-label={`Select ${label} theme`}
                        aria-pressed={isActive}
                      >
                        {/* Colour swatch */}
                        <div
                          className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center"
                          style={{ backgroundColor: swatch }}
                        >
                          {isActive && (
                            <Check size={20} className="text-white drop-shadow" strokeWidth={3} />
                          )}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                          {label}
                        </span>

                        {/* Active ring accent */}
                        {isActive && (
                          <span
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{ boxShadow: `0 0 0 2px white, 0 0 0 4px ${swatch}` }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live preview strip */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview</p>
                  </div>
                  <div className="p-4 flex flex-wrap items-center gap-3">
                    {/* Simulated sidebar active link */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg theme-sidebar-active text-sm font-medium w-fit">
                      <div className="w-4 h-4 bg-white/30 rounded" />
                      Active Nav Item
                    </div>
                    {/* Simulated primary button */}
                    <div className="px-4 py-2 rounded-lg theme-btn-primary text-sm font-medium text-white w-fit cursor-default">
                      Primary Button
                    </div>
                    {/* Simulated badge */}
                    <div className="px-2.5 py-0.5 rounded-full theme-badge text-xs font-semibold w-fit">
                      Badge
                    </div>
                    {/* Simulated logo icon */}
                    <div className="w-8 h-8 theme-logo-icon rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Rx</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Theme applies instantly across the sidebar, buttons, and interactive elements.
                </p>
              </div>
            </Card>
          )}

          {/* ── Expenses ── */}
          {tab === "expenses" && (
            <div className="space-y-6">
              {/* Add expense form */}
              <Card>
                <CardHeader title="Log Expense" subtitle="Record pharmacy operating costs" />
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Description *"
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      placeholder="e.g. Electricity Bill"
                    />
                    <Input
                      label="Amount (PKR) *"
                      type="number"
                      min={1}
                      value={expForm.amount}
                      onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                      placeholder="0"
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={expForm.category}
                        onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                        className={selectCls}
                      >
                        {["Utilities", "Salaries", "Rent", "Supplies", "Maintenance", "Transport", "Other"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Date"
                      type="date"
                      value={expForm.date}
                      onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" size="sm">
                    <Plus size={14} />
                    Add Expense
                  </Button>
                </form>
              </Card>

              {/* Expense list */}
              <Card padding={false}>
                <div className="p-6 pb-3">
                  <CardHeader
                    title="Expense History"
                    subtitle={`${expenses.length} records`}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-100">
                        {["Description", "Category", "Amount", "Date", ""].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-300 text-sm">
                            No expenses recorded
                          </td>
                        </tr>
                      ) : (
                        [...expenses]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((exp) => (
                            <tr key={exp.id} className="hover:bg-gray-50 group">
                              <td className="px-4 py-3 font-medium text-gray-800">{exp.description}</td>
                              <td className="px-4 py-3">
                                <Badge>{exp.category}</Badge>
                              </td>
                              <td className="px-4 py-3 font-semibold text-red-600">
                                {formatCurrency(exp.amount)}
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(exp.date)}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => { deleteExpense(exp.id); toast.success("Expense deleted"); }}
                                  className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ── Users ── */}
          {tab === "users" && (
            <div className="space-y-6">
              <Card padding={false}>
                <div className="p-6 pb-4 flex items-center justify-between">
                  <CardHeader
                    title="User Management"
                    subtitle={`${users.length} users`}
                  />
                  <Button size="sm" onClick={openAddUser}><Plus size={14} />Add User</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-100">
                        {["Name", "Username", "Email", "Role", "PIN", "Branch", "Status", ""].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 group">
                          <td className="px-4 py-3 font-semibold text-gray-800">{u.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">@{u.username}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                          <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                          <td className="px-4 py-3 font-mono text-gray-400 text-xs">{u.pin ? "••••" : "—"}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.branch ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditUser(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={13} /></button>
                              <button
                                onClick={() => { updateUser(u.id, { isActive: !u.isActive }); toast.success(u.isActive ? "User deactivated" : "User activated"); }}
                                className={`p-1.5 rounded-lg ${u.isActive ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
                                title={u.isActive ? "Deactivate" : "Activate"}
                              >
                                {u.isActive ? <Trash2 size={13} /> : <Check size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── User Modal ── */}
      <Modal isOpen={userModal} onClose={() => setUserModal(false)} title={editingUser ? "Edit User" : "Add New User"} size="md">
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Ali Hassan" required />
            <Input label="Username *" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} placeholder="ali" required />
            <Input label="Email *" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="ali@pharmacy.com" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                className={selectCls}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <Input label="4-digit PIN (for quick switch)" value={userForm.pin} onChange={(e) => setUserForm({ ...userForm, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 1234" maxLength={4} />
            <Input label="Branch" value={userForm.branch} onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })} placeholder="Main Branch" />
          </div>
          <div className="flex items-center gap-2.5">
            <input id="u-active" type="checkbox" checked={userForm.isActive} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
            <label htmlFor="u-active" className="text-sm text-gray-700 cursor-pointer">User is active</label>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setUserModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingUser ? "Save Changes" : "Create User"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
