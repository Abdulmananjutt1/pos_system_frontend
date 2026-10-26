"use client";

import { useMemo } from "react";
import { Sale, Expense, Medicine } from "@/types";
import { isExpired, isExpiringSoon } from "@/lib/utils";

export type DateRange = "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DateBounds {
  from: Date;
  to: Date;
}

/** Stable placeholder so Client Components can prerender without `new Date()`. */
export const UNSET_DATE_BOUNDS: DateBounds = {
  from: new Date(0),
  to: new Date(0),
};

export function getDateBounds(range: DateRange, now: Date, custom?: DateBounds): DateBounds {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (range) {
    case "today":
      return { from: startOf(now), to: endOf(now) };
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { from: startOf(y), to: endOf(y) };
    }
    case "7d": {
      const f = new Date(now); f.setDate(f.getDate() - 6);
      return { from: startOf(f), to: endOf(now) };
    }
    case "30d": {
      const f = new Date(now); f.setDate(f.getDate() - 29);
      return { from: startOf(f), to: endOf(now) };
    }
    case "custom":
      return custom ?? { from: startOf(now), to: endOf(now) };
    default:
      return { from: startOf(now), to: endOf(now) };
  }
}

export interface DashboardKPIs {
  // Financial
  totalRevenue: number;
  totalCOGS: number;          // cost of goods sold
  grossProfit: number;
  grossMarginPct: number;
  totalExpenses: number;
  netProfit: number;
  // Transactions
  totalTransactions: number;
  avgBillValue: number;
  // Patients
  uniqueCustomers: number;
  walkInCount: number;
  // Payment breakdown
  paymentBreakdown: { method: string; count: number; amount: number }[];
}

export interface TopMedicine {
  medicineId: string;
  name: string;
  qty: number;
  revenue: number;
  cogs: number;
}

export function useDashboardStats(
  sales: Sale[],
  expenses: Expense[],
  medicines: Medicine[],
  now: Date | null,
  bounds: DateBounds
): DashboardKPIs {
  return useMemo(() => {
    const inRange = sales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return s.status !== "Refunded" && t >= bounds.from.getTime() && t <= bounds.to.getTime();
    });

    const totalRevenue = inRange.reduce((sum, s) => sum + s.total, 0);

    // COGS: sum of purchase price × qty for each item sold
    const medMap = new Map(medicines.map((m) => [m.id, m]));
    const totalCOGS = inRange.reduce((sum, s) =>
      sum + s.items.reduce((si, i) => {
        const m = medMap.get(i.medicineId);
        return si + (m ? m.purchasePrice * i.quantity : 0);
      }, 0), 0
    );

    const grossProfit = totalRevenue - totalCOGS;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const expInRange = expenses.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= bounds.from.getTime() && t <= bounds.to.getTime();
    });
    const totalExpenses = expInRange.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    const totalTransactions = inRange.length;
    const avgBillValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const uniqueCustomers = new Set(
      inRange.filter((s) => s.customerId).map((s) => s.customerId)
    ).size;
    const walkInCount = inRange.filter((s) => !s.customerId).length;

    // Payment breakdown
    const pmMap: Record<string, { count: number; amount: number }> = {};
    inRange.forEach((s) => {
      if (!pmMap[s.paymentMethod]) pmMap[s.paymentMethod] = { count: 0, amount: 0 };
      pmMap[s.paymentMethod].count++;
      pmMap[s.paymentMethod].amount += s.total;
    });
    const paymentBreakdown = Object.entries(pmMap).map(([method, v]) => ({
      method,
      ...v,
    }));

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPct,
      totalExpenses,
      netProfit,
      totalTransactions,
      avgBillValue,
      uniqueCustomers,
      walkInCount,
      paymentBreakdown,
    };
  }, [sales, expenses, medicines, bounds]);
}

export function useTopMedicines(
  sales: Sale[],
  medicines: Medicine[],
  bounds: DateBounds,
  limit = 5
): TopMedicine[] {
  return useMemo(() => {
    const medMap = new Map(medicines.map((m) => [m.id, m]));
    const inRange = sales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return s.status !== "Refunded" && t >= bounds.from.getTime() && t <= bounds.to.getTime();
    });

    const agg: Record<string, TopMedicine> = {};
    inRange.forEach((s) => {
      s.items.forEach((i) => {
        if (!agg[i.medicineId]) {
          agg[i.medicineId] = { medicineId: i.medicineId, name: i.medicineName, qty: 0, revenue: 0, cogs: 0 };
        }
        agg[i.medicineId].qty += i.quantity;
        agg[i.medicineId].revenue += i.total;
        const m = medMap.get(i.medicineId);
        agg[i.medicineId].cogs += m ? m.purchasePrice * i.quantity : 0;
      });
    });

    return Object.values(agg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }, [sales, medicines, bounds, limit]);
}

export function useSalesTrend(sales: Sale[], bounds: DateBounds) {
  return useMemo(() => {
    const days: { label: string; revenue: number; transactions: number }[] = [];
    const from = new Date(bounds.from);
    const to = new Date(bounds.to);
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const dayCount = Math.min(diffDays + 1, 30);

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(to);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const daySales = sales.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return s.status !== "Refunded" && t >= dayStart.getTime() && t <= dayEnd.getTime();
      });

      days.push({
        label: d.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
        revenue: daySales.reduce((sum, s) => sum + s.total, 0),
        transactions: daySales.length,
      });
    }
    return days;
  }, [sales, bounds]);
}
