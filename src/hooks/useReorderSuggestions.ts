import { useMemo } from "react";
import { Medicine, Sale } from "@/types";
import { isExpiringSoon } from "@/lib/utils";

export interface ReorderSuggestion {
  medicine: Medicine;
  currentStock: number;
  minStock: number;
  suggestedQty: number;
  reason: string;
  priority: "Critical" | "High" | "Medium";
  avgDailySales?: number;
}

export function useReorderSuggestions(
  medicines: Medicine[],
  sales: Sale[],
  now: Date | null,
  days = 30
): ReorderSuggestion[] {
  return useMemo(() => {
    if (!now) return [];

    const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Calculate daily sales per medicine
    const salesMap: Record<string, number> = {};
    sales
      .filter((s) => s.status === "Completed" && new Date(s.createdAt) >= fromDate)
      .forEach((sale) => {
        sale.items.forEach((item) => {
          salesMap[item.medicineId] = (salesMap[item.medicineId] || 0) + item.quantity;
        });
      });

    const suggestions: ReorderSuggestion[] = [];
    const seen = new Set<string>();

    for (const med of medicines) {
      if (!med.isActive && med.isActive !== undefined) continue;
      const totalSold = salesMap[med.id] || 0;
      const avgDaily = totalSold / days;

      // Critical: out of stock
      if (med.stock === 0) {
        if (!seen.has(med.id)) {
          suggestions.push({
            medicine: med,
            currentStock: 0,
            minStock: med.minStock,
            suggestedQty: Math.max(med.minStock * 3, Math.round(avgDaily * 30) || med.minStock * 3),
            reason: "Out of stock",
            priority: "Critical",
            avgDailySales: avgDaily,
          });
          seen.add(med.id);
        }
        continue;
      }

      // High: below min stock
      if (med.stock <= med.minStock) {
        if (!seen.has(med.id)) {
          suggestions.push({
            medicine: med,
            currentStock: med.stock,
            minStock: med.minStock,
            suggestedQty: Math.max(med.minStock * 2 - med.stock, Math.round(avgDaily * 30) || med.minStock * 2),
            reason: "Below minimum stock level",
            priority: "High",
            avgDailySales: avgDaily,
          });
          seen.add(med.id);
        }
        continue;
      }

      // Medium: expiring soon with low stock coverage
      if (isExpiringSoon(med.expiryDate, 90, now) && avgDaily > 0) {
        const daysOfStock = med.stock / avgDaily;
        if (daysOfStock < 45 && !seen.has(med.id)) {
          suggestions.push({
            medicine: med,
            currentStock: med.stock,
            minStock: med.minStock,
            suggestedQty: Math.round(avgDaily * 30),
            reason: `Expiring soon — only ${Math.round(daysOfStock)} days of stock coverage`,
            priority: "Medium",
            avgDailySales: avgDaily,
          });
          seen.add(med.id);
        }
      }
    }

    // Sort by priority
    const order = { Critical: 0, High: 1, Medium: 2 };
    return suggestions.sort((a, b) => order[a.priority] - order[b.priority]);
  }, [medicines, sales, now, days]);
}
