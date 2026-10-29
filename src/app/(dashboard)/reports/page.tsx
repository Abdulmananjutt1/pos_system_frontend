"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingUp, ShoppingCart, Users, Package,
  Loader2, RefreshCw, RotateCcw, Tag,
} from "lucide-react";
import { reportService, ReportData } from "@/services/reportService";
import { toastApiError } from "@/lib/toast";

const PAYMENT_COLORS: Record<string, string> = {
  Cash:      "#3b82f6",
  Card:      "#8b5cf6",
  UBL:       "#f59e0b",
  JazzCash:  "#ef4444",
  EasyPaisa: "#10b981",
};

const DATE_PRESETS = [
  { label: "Today",      days: 0 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time",   days: -1 },
];

function getDateRange(days: number): { from: string; to: string } | undefined {
  if (days < 0) return undefined;
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return {
    from: from.toISOString().split("T")[0],
    to:   to.toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [preset, setPreset]       = useState(1); // Last 7 Days default
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]   = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      let params: { from?: string; to?: string } | undefined;
      if (useCustom && customFrom && customTo) {
        params = { from: customFrom, to: customTo };
      } else {
        params = getDateRange(DATE_PRESETS[preset].days);
      }
      const result = await reportService.getSummary(params);
      setData(result);
    } catch (err) {
      toastApiError(err);
    } finally {
      setLoading(false);
    }
  }, [preset, useCustom, customFrom, customTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return (
    <div><Header title="Reports & Analytics" />
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" /><span>Loading reports…</span>
      </div>
    </div>
  );

  if (!data) return (
    <div><Header title="Reports & Analytics" />
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 font-medium">Failed to load report data</p>
        <Button onClick={fetchReport} variant="outline"><RefreshCw size={14} />Retry</Button>
      </div>
    </div>
  );

  const { summary, paymentBreakdown, topMedicines, recentSales } = data;

  return (
    <div>
      <Header title="Reports & Analytics" />
      <div className="p-6 space-y-6">

        {/* Date filter */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => { setPreset(i); setUseCustom(false); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                !useCustom && preset === i
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}>
              {p.label}
            </button>
          ))}
          {/* Custom range */}
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button size="sm" variant="outline" onClick={() => { setUseCustom(true); fetchReport(); }}
              disabled={!customFrom || !customTo}>
              Apply
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={fetchReport} className="ml-auto">
            <RefreshCw size={13} />
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue"       value={formatCurrency(summary.totalRevenue)}   icon={TrendingUp}  iconColor="text-green-600"  iconBg="bg-green-50"  subtitle={`${summary.totalSales} transactions`} />
          <StatCard title="Avg. Order Value"    value={formatCurrency(summary.avgOrderValue)}  icon={ShoppingCart} iconColor="text-blue-600"  iconBg="bg-blue-50"   subtitle="per transaction" />
          <StatCard title="Total Discount"      value={formatCurrency(summary.totalDiscount)}  icon={Tag}         iconColor="text-orange-600" iconBg="bg-orange-50" subtitle="given to customers" />
          <StatCard title="Returns / Refunds"   value={`${summary.totalReturns}`}              icon={RotateCcw}   iconColor="text-red-600"    iconBg="bg-red-50"    subtitle={formatCurrency(summary.totalRefunded)} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers"  value={summary.totalCustomers} icon={Users}   iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="registered" />
          <StatCard title="Total Medicines"  value={summary.totalMedicines} icon={Package} iconColor="text-teal-600"   iconBg="bg-teal-50"   subtitle="in catalogue" />
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.totalRevenue - summary.totalRefunded)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">after refunds</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Refund Rate</p>
              <p className="text-lg font-bold text-red-500 mt-1">
                {summary.totalSales > 0
                  ? ((summary.totalReturns / summary.totalSales) * 100).toFixed(1)
                  : "0"}%
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Payment method chart */}
          <Card>
            <CardHeader title="Sales by Payment Method" subtitle="Transaction count per method" />
            {paymentBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentBreakdown} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                  <XAxis dataKey="method" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === "count" ? `${val} sales` : formatCurrency(Number(val)),
                      name === "count" ? "Transactions" : "Revenue",
                    ]}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {paymentBreakdown.map((entry) => (
                      <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] ?? "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top medicines */}
          <Card>
            <CardHeader title="Top Selling Medicines" subtitle="By revenue in selected period" />
            {topMedicines.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No sales data</div>
            ) : (
              <div className="space-y-3">
                {topMedicines.map((med, i) => (
                  <div key={med.medicineId} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{med.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.min((med.revenue / (topMedicines[0]?.revenue || 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{med.qty} units</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(med.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Transactions table */}
        <Card padding={false}>
          <div className="p-6 pb-3">
            <CardHeader title="Transactions" subtitle={`${recentSales.length} in selected period`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  {["Invoice", "Customer", "Items", "Payment", "Discount", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-300">No transactions in this period</td></tr>
                ) : recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{sale.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{sale.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{sale.itemCount}</td>
                    <td className="px-4 py-3"><Badge>{sale.paymentMethod}</Badge></td>
                    <td className="px-4 py-3 text-green-600">{sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.status === "Completed" ? "success" : sale.status === "Refunded" ? "danger" : "warning"}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
