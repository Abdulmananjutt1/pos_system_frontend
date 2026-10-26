"use client";

import { CreditCard, Smartphone, Banknote, Building2, Wallet } from "lucide-react";
import { PaymentMethod } from "@/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  Cash: <Banknote size={14} />,
  Card: <CreditCard size={14} />,
  UBL: <Building2 size={14} />,
  JazzCash: <Smartphone size={14} />,
  EasyPaisa: <Smartphone size={14} />,
  Credit: <Wallet size={14} />,
};

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({
  selected,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {PAYMENT_METHODS.map((pm) => (
        <button
          key={pm}
          onClick={() => onChange(pm)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-2 px-1 text-xs rounded-xl border font-medium transition-all",
            selected === pm
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
          )}
          aria-pressed={selected === pm}
        >
          {methodIcons[pm]}
          {pm}
        </button>
      ))}
    </div>
  );
}
