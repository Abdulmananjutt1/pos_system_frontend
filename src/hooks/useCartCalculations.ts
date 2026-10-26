"use client";

import { useMemo } from "react";
import { SaleItem } from "@/types";
import { TAX_RATE } from "@/lib/constants";

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

export function useCartCalculations(
  cart: SaleItem[],
  discount: number = 0
): CartTotals {
  return useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = Math.min(discount, subtotal);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * TAX_RATE;
    const total = taxableAmount + taxAmount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, discountAmount, taxAmount, total, itemCount };
  }, [cart, discount]);
}
