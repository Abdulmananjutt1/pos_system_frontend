"use client";

import { ShoppingCart, Trash2, SplitSquareVertical } from "lucide-react";
import CartItem from "./CartItem";
import CustomerSelector from "./CustomerSelector";
import DiscountInput from "./DiscountInput";
import PaymentMethodSelector from "./PaymentMethodSelector";
import Button from "@/components/ui/Button";
import { Customer, Medicine, PaymentMethod, SaleItem } from "@/types";
import { CartTotals } from "@/hooks/useCartCalculations";
import { DiscountType } from "@/hooks/useDiscountInput";
import { formatCurrency } from "@/lib/utils";

interface CartPanelProps {
  cart: SaleItem[];
  medicines: Medicine[];
  customers: Customer[];
  selectedCustomer: Customer | null;
  totals: CartTotals;
  discountType: DiscountType;
  discountValue: number;
  paymentMethod: PaymentMethod;
  allowLineDiscount?: boolean;
  allowSplitPayment?: boolean;
  allowBillDiscount?: boolean;
  taxRate?: number;
  onSetCustomer: (c: Customer | null) => void;
  onAddNewCustomer: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateItemDiscount?: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
  onClearCart: () => void;
  onDiscountTypeChange: (t: DiscountType) => void;
  onDiscountValueChange: (v: number) => void;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onCheckout: () => void;
  onSplitPayment?: () => void;
}

export default function CartPanel({
  cart,
  medicines,
  customers,
  selectedCustomer,
  totals,
  discountType,
  discountValue,
  paymentMethod,
  allowLineDiscount = true,
  allowSplitPayment = true,
  allowBillDiscount = true,
  taxRate = 0,
  onSetCustomer,
  onAddNewCustomer,
  onUpdateQty,
  onUpdateItemDiscount,
  onRemove,
  onClearCart,
  onDiscountTypeChange,
  onDiscountValueChange,
  onPaymentMethodChange,
  onCheckout,
  onSplitPayment,
}: CartPanelProps) {
  const getMaxQty = (medicineId: string) => {
    return medicines.find((m) => m.id === medicineId)?.stock;
  };

  return (
    <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800">
              Cart
              {totals.itemCount > 0 && (
                <span className="ml-1.5 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  {totals.itemCount}
                </span>
              )}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          )}
        </div>

        <CustomerSelector
          customers={customers}
          selected={selectedCustomer}
          onSelect={onSetCustomer}
          onAddNew={onAddNewCustomer}
        />
      </div>

      {/* ── Items ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
            <ShoppingCart size={40} strokeWidth={1.5} />
            <p className="text-sm mt-2">Cart is empty</p>
            <p className="text-xs mt-1">Click medicines to add them</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.medicineId}
              item={item}
              maxQty={getMaxQty(item.medicineId)}
              allowLineDiscount={allowLineDiscount}
              onUpdateQty={onUpdateQty}
              onUpdateDiscount={onUpdateItemDiscount}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">

        {/* Bill-level Discount */}
        {allowBillDiscount && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Bill Discount
            </p>
            <DiscountInput
              discountType={discountType}
              discountValue={discountValue}
              onTypeChange={onDiscountTypeChange}
              onValueChange={onDiscountValueChange}
              subtotal={totals.subtotal}
            />
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          {taxRate > 0 && totals.taxAmount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(totals.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Payment Method
          </p>
          <PaymentMethodSelector
            selected={paymentMethod}
            onChange={onPaymentMethodChange}
          />
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            onClick={onCheckout}
            disabled={cart.length === 0}
          >
            <ShoppingCart size={16} />
            Checkout — {formatCurrency(totals.total)}
          </Button>

          {allowSplitPayment && onSplitPayment && cart.length > 0 && (
            <button
              onClick={onSplitPayment}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors"
            >
              <SplitSquareVertical size={13} />
              Split Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
