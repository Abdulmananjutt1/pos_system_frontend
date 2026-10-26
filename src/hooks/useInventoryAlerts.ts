"use client";

import { useMemo } from "react";
import { Medicine } from "@/types";
import { isExpired, isExpiringSoon } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD, EXPIRY_WARNING_DAYS } from "@/lib/constants";

export interface InventoryAlerts {
  outOfStock: Medicine[];
  lowStock: Medicine[];
  expiringSoon: Medicine[];
  expired: Medicine[];
  totalAlerts: number;
}

export function useInventoryAlerts(
  medicines: Medicine[],
  now: Date | null
): InventoryAlerts {
  return useMemo(() => {
    const outOfStock = medicines.filter((m) => m.stock === 0);
    const lowStock = medicines.filter(
      (m) => m.stock > 0 && m.stock <= LOW_STOCK_THRESHOLD
    );
    const expiringSoon = now
      ? medicines.filter(
          (m) =>
            !isExpired(m.expiryDate, now) &&
            isExpiringSoon(m.expiryDate, EXPIRY_WARNING_DAYS, now)
        )
      : [];
    const expired = now
      ? medicines.filter((m) => isExpired(m.expiryDate, now))
      : [];

    return {
      outOfStock,
      lowStock,
      expiringSoon,
      expired,
      totalAlerts:
        outOfStock.length + lowStock.length + expiringSoon.length + expired.length,
    };
  }, [medicines, now]);
}
