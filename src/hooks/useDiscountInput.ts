"use client";

import { useState, useCallback } from "react";

export type DiscountType = "flat" | "percent";

export function useDiscountInput(subtotal: number) {
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const discountAmount = useCallback(() => {
    if (discountType === "percent") {
      return Math.min((subtotal * discountValue) / 100, subtotal);
    }
    return Math.min(discountValue, subtotal);
  }, [discountType, discountValue, subtotal]);

  const reset = useCallback(() => {
    setDiscountValue(0);
  }, []);

  return {
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    discountAmount: discountAmount(),
    reset,
  };
}
