"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, TrendingUp, TrendingDown, Package, Users,
  AlertTriangle, Clock, DollarSign, ReceiptText,
  ArrowUpRight, ArrowDownRight, Plus, Loader2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import Header from "@/components/layout/Header";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { apiGet, apiPost } from "@/lib/apiClient";

type DateRange = "today" | "yesterday" | "7d" | "30d";

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d",        label: "Last 7 Days" },
  { key: "30d",       label: "Last 30 Days" },
];

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "#3b82f6", Card: "#8b5cf6", UBL: "#f59e0b",
  JazzCash: "#ef4444", EasyPaisa: "#10b981",
};

interface DashboardData {
  kpis: {
    totalRevenue: number; totalCOGS: number; grossProfit: number;
    grossMarginPct: number; totalExpenses: number; netProfit: number;
    totalTransactions: number; avgBillValue: number;
    uniqueCustomers: number; walkInCount: number; totalDiscount: number;
  };
  alerts: { outOfStock: number; lowStock: number; expiringSoon: number; expired: number; totalAlerts: number };
  paymentBreakdown: { method: string; count: number; amount: number }[];
  topMedicines: { medicineId: string; name: string; qty: number; revenue: number }[];
  inventoryCounts: { total: number; customers: number };
  nearExpiry: { id: string; name: string; brand: string; batchNumber: string; expiryDate: string; isExpired: boolean }[];
  recentSales: { id: string; invoiceNumber: string; customerName: string; total: number; discount: number; paymentMethod: string; status: string; itemCount: number; createdAt: string }[];
  trend: { label: string; revenue: number; transactions: number }[];
}

export default function DashboardPage() {
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [expenseModal, setExpenseModal] = useState(false);
  const [expForm, setExpForm]   = useState({ description: "", amount: "", category: "Utilities", date: "" });
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    setExpForm((f) => ({ ...f, date: new Date().toISOString().split("T")[0] }));
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiGet<DashboardData>("/dashboard", { range: dateRange });
      setData(result);
    } catch (err) {
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description || !expForm.amount) return;
    setSavingExpense(true);
    try {
      await apiPost("/expenses", {
        description: expForm.description,
        amount:      Number(expForm.amount),
        category:    expForm.category,
        date:        expForm.date || new Date().toISOString().split("T")[0],
      });
      toastSuccess("Expense recorded");
      setExpForm({ description: "", amount: "", category: "Utilities", date: new Date().toISOString().split("T")[0] });
      setExpenseModal(false);
      fetchDashboard(); // refresh KPIs
    } catch (err) {
      toastApiError(err);
    } finally {
      setSavingExpense(false);
    }
  };

  if (loading || !data) return (
    <div>
      <Header title="Dashboard" />
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /><span>Loading dashboard…</span>
      </div>
    </div>
  );

  const { kpis, alerts, paymentBreakdown, topMedicines, inventoryCounts, nearExpiry, recentSales, trend } = data;

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Date Range + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {DATE_RANGES.map(({ key, label }) => (
              <button key={key} onClick={() => setDateRange(key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  dateRange === key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchDashboard}><RefreshCw size={14} /></Button>
            <Button size="sm" variant="outline" onClick={() => setExpenseModal(true)}>
              <Plus size={14} />Log Expense
            </Button>
          </div>
        </div>

        {/* Alert row */}
        {alerts.totalAlerts > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {alerts.outOfStock   > 0 && <AlertTile icon={Package}       color="red"    label="Out of Stock"   count={alerts.outOfStock}   />}
            {alerts.lowStock     > 0 && <AlertTile icon={AlertTriangle}  color="yellow" label="Low Stock"       count={alerts.lowStock}     />}
            {alerts.expiringSoon > 0 && <AlertTile icon={Clock}          color="orange" label="Expiring Soon"  count={alerts.expiringSoon} />}
            {alerts.expired      > 0 && <AlertTile icon={Clock}          color="red"    label="Expired"         count={alerts.expired}      />}
          </div>
        )}

        {/* Financial KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Total Revenue"   value={formatCurrency(kpis.totalRevenue)}   icon={TrendingUp}                                            color="blue"   />
          <KpiCard title="Purchase Cost"   value={formatCurrency(kpis.totalCOGS)}      icon={Package}                                               color="purple" />
          <KpiCard title="Gross Profit"    value={formatCurrency(kpis.grossProfit)}    sub={`${kpis.grossMarginPct.toFixed(1)}% margin`} icon={DollarSign} color={kpis.grossProfit >= 0 ? "green" : "red"} />
          <KpiCard title="Expenses"        value={formatCurrency(kpis.totalExpenses)}  icon={TrendingDown}                                          color="orange" />
          <KpiCard title="Net Profit"      value={formatCurrency(kpis.netProfit)}      icon={kpis.netProfit >= 0 ? ArrowUpRight : ArrowDownRight}    color={kpis.netProfit >= 0 ? "green" : "red"} />
          <KpiCard title="Transactions"    value={kpis.totalTransactions}              sub={`Avg ${formatCurrency(kpis.avgBillValue)}`} icon={ReceiptText} color="blue" />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SmallStat label="Unique Customers" value={kpis.uniqueCustomers} />
          <SmallStat label="Walk-in Sales"    value={kpis.walkInCount} />
          <SmallStat label="Total Medicines"  value={inventoryCounts.total} />
          <SmallStat label="Total Customers"  value={inventoryCounts.customers} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales trend */}
          <Card className="lg:col-span-2" padding={false}>
            <div className="p-6 pb-2">
              <CardHeader title="Sales Trend" subtitle="Revenue over selected period" />
            </div>
            {trend.length > 0 && trend.some((t) => t.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No sales data for this period</div>
            )}
          </Card>

          {/* Payment breakdown */}
          <Card padding={false}>
            <div className="p-6 pb-2">
              <CardHeader title="Payment Methods" subtitle="By transaction count" />
            </div>
            {paymentBreakdown.length > 0 ? (
              <div className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={paymentBreakdown} layout="vertical" margin={{ left: 0, right: 12 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="method" type="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        name === "count" ? `${v} sales` : formatCurrency(v),
                        name === "count" ? "Transactions" : "Revenue",
                      ]}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {paymentBreakdown.map((entry) => (
                        <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] ?? "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {paymentBreakdown.map((e) => (
                    <div key={e.method} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAYMENT_COLORS[e.method] ?? "#6b7280" }} />
                        <span className="text-gray-600">{e.method}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm px-4 text-center">No payment data</div>
            )}
          </Card>
        </div>

        {/* Top Medicines + Expiry */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Top Selling Medicines" subtitle="By revenue in period" />
            {topMedicines.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">No sales data</p>
            ) : (
              <div className="space-y-3">
                {topMedicines.map((med, i) => (
                  <div key={med.medicineId} className="flex items-center gap-3">
                    <span className="w-6 h-6 text-xs font-bold rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.min((med.revenue / (topMedicines[0]?.revenue || 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{med.qty} units</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 shrink-0">{formatCurrency(med.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Expiry Alerts" subtitle="Expired or expiring within 30 days"
              action={nearExpiry.length > 0 ? <Badge variant="warning">{nearExpiry.length} items</Badge> : undefined} />
            {nearExpiry.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">All medicines are within expiry range</p>
            ) : (
              <div className="space-y-2">
                {nearExpiry.map((med) => (
                  <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.brand} • Batch: {med.batchNumber}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <Badge variant={med.isExpired ? "danger" : "warning"}>{med.isExpired ? "Expired" : "Expiring"}</Badge>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(med.expiryDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card padding={false}>
          <div className="p-6 pb-3">
            <CardHeader title="Recent Transactions" subtitle={`${recentSales.length} in selected period`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  {["Invoice", "Customer", "Items", "Payment", "Discount", "Total", "Status", "Time"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-300">No transactions in this period</td></tr>
                ) : recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{s.itemCount}</td>
                    <td className="px-4 py-3"><Badge>{s.paymentMethod}</Badge></td>
                    <td className="px-4 py-3 text-green-600">{s.discount > 0 ? `-${formatCurrency(s.discount)}` : "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(s.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "Completed" ? "success" : s.status === "Refunded" ? "danger" : "warning"}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Log Expense Modal */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Log Expense" size="sm">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input label="Description *" value={expForm.description}
            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
            placeholder="e.g. Electricity Bill" required />
          <Input label="Amount (PKR) *" type="number" min={1} value={expForm.amount}
            onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
            placeholder="0" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {["Utilities", "Salaries", "Rent", "Supplies", "Maintenance", "Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Date" type="date" value={expForm.date}
            onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setExpenseModal(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" disabled={savingExpense}>
              {savingExpense ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: "blue" | "green" | "red" | "purple" | "orange";
}) {
  const bg = { blue: "bg-blue-50", green: "bg-green-50", red: "bg-red-50", purple: "bg-purple-50", orange: "bg-orange-50" }[color];
  const fg = { blue: "text-blue-600", green: "text-green-600", red: "text-red-600", purple: "text-purple-600", orange: "text-orange-600" }[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 leading-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${fg}`} /></div>
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
}

function AlertTile({ icon: Icon, color, label, count }: {
  icon: React.ElementType; color: "red" | "yellow" | "orange"; label: string; count: number;
}) {
  const styles = {
    red:    { bg: "bg-red-50",    border: "border-red-200",    icon: "text-red-500",    text: "text-red-800",    sub: "text-red-600"    },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", icon: "text-yellow-500", text: "text-yellow-800", sub: "text-yellow-600" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500", text: "text-orange-800", sub: "text-orange-600" },
  }[color];
  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-3 flex items-center gap-3`}>
      <Icon size={20} className={`${styles.icon} shrink-0`} />
      <div>
        <p className={`text-lg font-bold ${styles.text}`}>{count}</p>
        <p className={`text-xs ${styles.sub}`}>{label}</p>
      </div>
    </div>
  );
}
