"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart, TrendingUp, TrendingDown, Package, Users,
  AlertTriangle, Clock, DollarSign, ReceiptText, BarChart3,
  ArrowUpRight, ArrowDownRight, Plus,
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
import { usePharmacyStore } from "@/store";
import { formatCurrency, isExpiringSoon, isExpired, formatDate } from "@/lib/utils";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import {
  useDashboardStats, useTopMedicines, useSalesTrend,
  getDateBounds, DateRange, UNSET_DATE_BOUNDS,
} from "@/hooks/useDashboardStats";
import toast from "react-hot-toast";

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
];

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "#3b82f6",
  Card: "#8b5cf6",
  UBL: "#f59e0b",
  JazzCash: "#ef4444",
  EasyPaisa: "#10b981",
};

export default function DashboardPage() {
  const { medicines, sales, customers, expenses, addExpense } = usePharmacyStore();
  const [now, setNow] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [expenseModal, setExpenseModal] = useState(false);
  const [expForm, setExpForm] = useState({ description: "", amount: "", category: "Utilities", date: "" });

  useEffect(() => {
    setNow(new Date());
    setExpForm((f) => ({ ...f, date: new Date().toISOString().split("T")[0] }));
  }, []);

  const bounds = useMemo(
    () => (now ? getDateBounds(dateRange, now) : UNSET_DATE_BOUNDS),
    [dateRange, now]
  );
  const alerts = useInventoryAlerts(medicines, now);
  const kpis = useDashboardStats(sales, expenses, medicines, now, bounds);
  const topMeds = useTopMedicines(sales, medicines, bounds, 5);
  const trend = useSalesTrend(sales, bounds);

  // Near-expiry table (next 30 days)
  const nearExpiry = now
    ? medicines
        .filter((m) => isExpiringSoon(m.expiryDate, 30, now) || isExpired(m.expiryDate, now))
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
        .slice(0, 6)
    : [];

  // Recent sales in range
  const recentSales = sales
    .filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= bounds.from.getTime() && t <= bounds.to.getTime();
    })
    .slice(0, 6);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description || !expForm.amount) return;
    addExpense({
      description: expForm.description,
      amount: Number(expForm.amount),
      category: expForm.category,
      date: expForm.date || new Date().toISOString().split("T")[0],
    });
    toast.success("Expense recorded");
    setExpForm({ description: "", amount: "", category: "Utilities", date: new Date().toISOString().split("T")[0] });
    setExpenseModal(false);
  };

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* ── Date Range + Action bar ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  dateRange === key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setExpenseModal(true)}>
            <Plus size={14} />
            Log Expense
          </Button>
        </div>

        {/* ── Alert row ─────────────────────────────────────────────────── */}
        {alerts.totalAlerts > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {alerts.outOfStock.length > 0 && (
              <AlertTile icon={Package} color="red" label="Out of Stock" count={alerts.outOfStock.length} />
            )}
            {alerts.lowStock.length > 0 && (
              <AlertTile icon={AlertTriangle} color="yellow" label="Low Stock" count={alerts.lowStock.length} />
            )}
            {alerts.expiringSoon.length > 0 && (
              <AlertTile icon={Clock} color="orange" label="Expiring Soon" count={alerts.expiringSoon.length} />
            )}
            {alerts.expired.length > 0 && (
              <AlertTile icon={Clock} color="red" label="Expired" count={alerts.expired.length} />
            )}
          </div>
        )}

        {/* ── Financial KPIs ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(kpis.totalRevenue)}
            icon={TrendingUp}
            color="blue"
          />
          <KpiCard
            title="Purchase Cost"
            value={formatCurrency(kpis.totalCOGS)}
            icon={Package}
            color="purple"
          />
          <KpiCard
            title="Gross Profit"
            value={formatCurrency(kpis.grossProfit)}
            sub={`${kpis.grossMarginPct.toFixed(1)}% margin`}
            icon={DollarSign}
            color={kpis.grossProfit >= 0 ? "green" : "red"}
          />
          <KpiCard
            title="Expenses"
            value={formatCurrency(kpis.totalExpenses)}
            icon={TrendingDown}
            color="orange"
          />
          <KpiCard
            title="Net Profit"
            value={formatCurrency(kpis.netProfit)}
            icon={kpis.netProfit >= 0 ? ArrowUpRight : ArrowDownRight}
            color={kpis.netProfit >= 0 ? "green" : "red"}
          />
          <KpiCard
            title="Transactions"
            value={kpis.totalTransactions}
            sub={`Avg ${formatCurrency(kpis.avgBillValue)}`}
            icon={ReceiptText}
            color="blue"
          />
        </div>

        {/* ── Secondary KPIs ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SmallStat label="Unique Customers" value={kpis.uniqueCustomers} />
          <SmallStat label="Walk-in Sales" value={kpis.walkInCount} />
          <SmallStat label="Total Medicines" value={medicines.length} />
          <SmallStat label="Total Customers" value={customers.length} />
        </div>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales trend */}
          <Card className="lg:col-span-2" padding={false}>
            <div className="p-6 pb-2">
              <CardHeader
                title="Sales Trend"
                subtitle={`Revenue over selected period`}
              />
            </div>
            {trend.length > 0 && trend.some((t) => t.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
                No sales data for this period
              </div>
            )}
          </Card>

          {/* Payment breakdown */}
          <Card padding={false}>
            <div className="p-6 pb-2">
              <CardHeader title="Payment Methods" subtitle="By transaction count" />
            </div>
            {kpis.paymentBreakdown.length > 0 ? (
              <div className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={kpis.paymentBreakdown} layout="vertical" margin={{ left: 0, right: 12 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="method" type="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        name === "count" ? `${v} sales` : formatCurrency(v),
                        name === "count" ? "Transactions" : "Revenue",
                      ]}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {kpis.paymentBreakdown.map((entry) => (
                        <Cell
                          key={entry.method}
                          fill={PAYMENT_COLORS[entry.method] ?? "#6b7280"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="space-y-1.5 mt-2">
                  {kpis.paymentBreakdown.map((e) => (
                    <div key={e.method} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: PAYMENT_COLORS[e.method] ?? "#6b7280" }}
                        />
                        <span className="text-gray-600">{e.method}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm px-4 text-center">
                No payment data
              </div>
            )}
          </Card>
        </div>

        {/* ── Top Medicines + Expiry table ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top medicines */}
          <Card>
            <CardHeader title="Top Selling Medicines" subtitle="By revenue in period" />
            {topMeds.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">No sales data</p>
            ) : (
              <div className="space-y-3">
                {topMeds.map((med, i) => {
                  const margin = med.revenue > 0 ? ((med.revenue - med.cogs) / med.revenue) * 100 : 0;
                  return (
                    <div key={med.medicineId} className="flex items-center gap-3">
                      <span className="w-6 h-6 text-xs font-bold rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${Math.min((med.revenue / (topMeds[0]?.revenue || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{med.qty} units</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(med.revenue)}</p>
                        <p className="text-xs text-green-600">{margin.toFixed(0)}% margin</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Near expiry */}
          <Card>
            <CardHeader
              title="Expiry Alerts"
              subtitle="Expired or expiring within 30 days"
              action={
                nearExpiry.length > 0 ? (
                  <Badge variant="warning">{nearExpiry.length} items</Badge>
                ) : undefined
              }
            />
            {nearExpiry.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">
                All medicines are within expiry range
              </p>
            ) : (
              <div className="space-y-2">
                {nearExpiry.map((med) => {
                  const exp = now ? isExpired(med.expiryDate, now) : false;
                  return (
                    <div
                      key={med.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                        <p className="text-xs text-gray-400">{med.brand} • Batch: {med.batchNumber}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <Badge variant={exp ? "danger" : "warning"}>
                          {exp ? "Expired" : "Expiring"}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(med.expiryDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Recent Transactions ───────────────────────────────────────── */}
        <Card padding={false}>
          <div className="p-6 pb-3">
            <CardHeader
              title="Recent Transactions"
              subtitle={`${recentSales.length} in selected period`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  {["Invoice", "Customer", "Items", "Payment", "Discount", "Total", "Status", "Time"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-300">
                      No transactions in this period
                    </td>
                  </tr>
                ) : (
                  recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.invoiceNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.customerName}</td>
                      <td className="px-4 py-3 text-gray-500">{s.items.length}</td>
                      <td className="px-4 py-3"><Badge>{s.paymentMethod}</Badge></td>
                      <td className="px-4 py-3 text-green-600">{s.discount > 0 ? `-${formatCurrency(s.discount)}` : "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(s.total)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === "Completed" ? "success" : s.status === "Refunded" ? "danger" : "warning"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Add Expense Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Log Expense" size="sm">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input
            label="Description *"
            value={expForm.description}
            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
            placeholder="e.g. Electricity Bill"
            required
          />
          <Input
            label="Amount (PKR) *"
            type="number"
            min={1}
            value={expForm.amount}
            onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
            placeholder="0"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={expForm.category}
              onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["Utilities", "Salaries", "Rent", "Supplies", "Maintenance", "Other"].map((c) => (
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
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setExpenseModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, icon: Icon, color,
}: {
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
        <div className={`p-2.5 rounded-xl shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 ${fg}`} />
        </div>
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

function AlertTile({
  icon: Icon, color, label, count,
}: {
  icon: React.ElementType; color: "red" | "yellow" | "orange";
  label: string; count: number;
}) {
  const styles = {
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500", text: "text-red-800", sub: "text-red-600" },
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
