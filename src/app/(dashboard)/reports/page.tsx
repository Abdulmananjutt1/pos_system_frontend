"use client";

import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { usePharmacyStore } from "@/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, Users, Package } from "lucide-react";

export default function ReportsPage() {
  const { sales, medicines, customers } = usePharmacyStore();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Sales by payment method
  const paymentMethodData = ["Cash", "Card", "UBL", "JazzCash", "EasyPaisa"].map(
    (pm) => ({
      name: pm,
      sales: sales.filter((s) => s.paymentMethod === pm).length,
      revenue: sales
        .filter((s) => s.paymentMethod === pm)
        .reduce((sum, s) => sum + s.total, 0),
    })
  );

  // Top selling medicines
  const medicineSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!medicineSalesMap[item.medicineId]) {
        medicineSalesMap[item.medicineId] = {
          name: item.medicineName,
          qty: 0,
          revenue: 0,
        };
      }
      medicineSalesMap[item.medicineId].qty += item.quantity;
      medicineSalesMap[item.medicineId].revenue += item.total;
    });
  });

  const topMedicines = Object.values(medicineSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div>
      <Header title="Reports & Analytics" />
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Total Transactions"
            value={totalSales}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Avg. Order Value"
            value={formatCurrency(avgOrderValue)}
            icon={Package}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Total Customers"
            value={customers.length}
            icon={Users}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Chart */}
          <Card>
            <CardHeader
              title="Sales by Payment Method"
              subtitle="Transaction count per method"
            />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name === "sales" ? val : formatCurrency(Number(val)),
                    name === "sales" ? "Transactions" : "Revenue",
                  ]}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Medicines */}
          <Card>
            <CardHeader
              title="Top Selling Medicines"
              subtitle="By revenue"
            />
            {topMedicines.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No sales data
              </p>
            ) : (
              <div className="space-y-3">
                {topMedicines.map((med, i) => (
                  <div
                    key={med.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {med.qty} units sold
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(med.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader
            title="All Transactions"
            subtitle={`${sales.length} total`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Invoice",
                    "Customer",
                    "Items",
                    "Payment",
                    "Total",
                    "Status",
                    "Date",
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs text-gray-600">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 text-gray-700">
                      {sale.customerName}
                    </td>
                    <td className="py-3 text-gray-500">
                      {sale.items.length} item(s)
                    </td>
                    <td className="py-3">
                      <Badge>{sale.paymentMethod}</Badge>
                    </td>
                    <td className="py-3 font-semibold text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          sale.status === "Completed" ? "success" : "warning"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
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
