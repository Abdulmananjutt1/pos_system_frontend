"use client";

import { useState, useCallback } from "react";
import {
  ShoppingCart, History, Scan, PauseCircle, Key, Banknote,
  ClipboardPen,
} from "lucide-react";
import toast from "react-hot-toast";

import Header from "@/components/layout/Header";
import MedicineGrid from "@/components/sales/MedicineGrid";
import BarcodeInput from "@/components/sales/BarcodeInput";
import CartPanel from "@/components/sales/CartPanel";
import PaymentModal from "@/components/sales/PaymentModal";
import SplitPaymentModal from "@/components/sales/SplitPaymentModal";
import InvoicePrint from "@/components/sales/InvoicePrint";
import SaleHistoryPanel from "@/components/sales/SaleHistoryPanel";
import QuickAddCustomerModal from "@/components/sales/QuickAddCustomerModal";
import HeldSalesDrawer from "@/components/sales/HeldSalesDrawer";
import PINPadModal from "@/components/sales/PINPadModal";
import CashShiftModal from "@/components/sales/CashShiftModal";
import PrescriptionModal, { PrescriptionData } from "@/components/sales/PrescriptionModal";
import GenericSubstitutionModal from "@/components/sales/GenericSubstitutionModal";

import { usePharmacyStore } from "@/store";
import { useCartCalculations } from "@/hooks/useCartCalculations";
import { useDiscountInput } from "@/hooks/useDiscountInput";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Customer, Medicine, PaymentMethod, Sale, SplitPaymentEntry } from "@/types";

type Tab = "pos" | "history";

export default function SalesPage() {
  const {
    medicines,
    customers,
    sales,
    cart,
    heldSales,
    selectedCustomer,
    settings,
    currentShift,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartItemDiscount,
    clearCart,
    setSelectedCustomer,
    completeSale,
    addCustomer,
    holdSale,
    resumeHeld,
    deleteHeld,
  } = usePharmacyStore();

  // ── UI State ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("pos");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [shiftMode, setShiftMode] = useState<"open" | "close" | "summary">("open");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [genericSource, setGenericSource] = useState<Medicine | null>(null);

  // ── Discount ───────────────────────────────────────────────────────────────
  const subtotalRaw = cart.reduce((s, i) => s + i.total, 0);
  const discountState = useDiscountInput(subtotalRaw);
  const totals = useCartCalculations(cart, discountState.discountAmount);

  // ── Barcode Scanner ────────────────────────────────────────────────────────
  const handleScanCode = useCallback(
    (code: string) => {
      const med = medicines.find(
        (m) =>
          m.id.toLowerCase() === code.toLowerCase() ||
          m.batchNumber?.toLowerCase() === code.toLowerCase()
      );
      if (!med) {
        toast.error(`No medicine found for: ${code}`);
        return;
      }
      if (med.stock === 0) {
        toast.error(`${med.name} is out of stock`);
        return;
      }
      addToCart(med);
      toast.success(`${med.name} added via scanner`);
    },
    [medicines, addToCart]
  );

  useBarcodeScanner({
    onScan: handleScanCode,
    enabled: tab === "pos" && !showPaymentModal && !showSplitModal,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectMedicine = (med: Medicine) => {
    if (med.stock === 0) { toast.error(`${med.name} is out of stock`); return; }
    addToCart(med);
    toast.success(`${med.name} added`);
    // Check for generic substitutes
    const subs = medicines.filter((m) => m.genericName === med.genericName && m.id !== med.id && m.stock > 0);
    if (subs.length > 0) {
      setGenericSource(med);
      setShowGenericModal(true);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setShowPaymentModal(true);
  };

  const handleSplitCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setShowSplitModal(true);
  };

  const finalizeSale = (pm: string, discount: number, splits?: SplitPaymentEntry[]) => {
    setIsProcessing(true);
    setTimeout(() => {
      const sale = completeSale(pm, discount, splits, prescriptionData ? {
        doctorName: prescriptionData.doctorName || undefined,
        patientName: prescriptionData.patientName || undefined,
        prescriptionNote: prescriptionData.prescriptionNote || undefined,
      } : {});
      setIsProcessing(false);
      if (sale) {
        setCompletedSale(sale);
        setShowPaymentModal(false);
        setShowSplitModal(false);
        discountState.reset();
        setPrescriptionData(null);
        toast.success(`✓ Invoice ${sale.invoiceNumber} completed!`);
        setShowInvoice(true);
      }
    }, 300);
  };

  const handleConfirmPayment = () => {
    finalizeSale(paymentMethod, discountState.discountAmount);
  };

  const handleConfirmSplit = (entries: SplitPaymentEntry[]) => {
    // Use the first method as the primary paymentMethod on the record
    finalizeSale(entries[0].method, discountState.discountAmount, entries);
  };

  const handleHold = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    const label = `Sale ${new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`;
    holdSale(label);
    discountState.reset();
    toast.success("Sale held — resume anytime");
  };

  const handleAddCustomer = (
    data: Omit<Customer, "id" | "createdAt" | "totalPurchases">
  ) => {
    addCustomer(data);
    toast.success(`Customer ${data.name} added`);
    setTimeout(() => {
      const c = usePharmacyStore.getState().customers.find((cu) => cu.phone === data.phone);
      if (c) setSelectedCustomer(c);
    }, 50);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header title="Point of Sale" />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between py-2">
        <div className="flex items-center gap-1">
          <TabButton active={tab === "pos"} onClick={() => setTab("pos")} icon={<ShoppingCart size={15} />} label="New Sale" badge={cart.length > 0 ? cart.length : undefined} />
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<History size={15} />} label="Sale History" />
        </div>

        <div className="flex items-center gap-2">
          {/* Cash shift */}
          {tab === "pos" && (
            currentShift ? (
              <button onClick={() => { setShiftMode("summary"); setShowShift(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <Banknote size={13} />Shift Open
              </button>
            ) : (
              <button onClick={() => { setShiftMode("open"); setShowShift(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors">
                <Banknote size={13} />Open Shift
              </button>
            )
          )}

          {/* Prescription */}
          {tab === "pos" && (
            <button onClick={() => setShowPrescriptionModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${prescriptionData?.doctorName ? "text-purple-700 bg-purple-50 border-purple-200" : "text-gray-600 bg-white border-gray-200 hover:border-purple-300 hover:text-purple-700"}`}>
              <ClipboardPen size={13} />
              {prescriptionData?.doctorName ? `Rx: ${prescriptionData.doctorName}` : "Add Rx"}
            </button>
          )}

          {/* Hold button */}
          {tab === "pos" && settings.allowHoldSale && (
            <>
              {heldSales.length > 0 && (
                <button onClick={() => setShowHeldDrawer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  <PauseCircle size={13} />{heldSales.length} Held
                </button>
              )}
              <button onClick={handleHold} disabled={cart.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <PauseCircle size={13} />Hold Sale
              </button>
            </>
          )}

          {/* PIN switch */}
          <button onClick={() => setShowPIN(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-700 transition-colors">
            <Key size={13} />Switch User
          </button>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {tab === "pos" ? (
          <>
            {/* Left — medicine search + grid */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden gap-3">
              {/* Barcode input */}
              <div className="flex items-center gap-2">
                <Scan size={15} className="text-indigo-500 shrink-0" />
                <span className="text-xs text-gray-500 shrink-0">Barcode:</span>
                <BarcodeInput onScan={handleScanCode} className="flex-1" />
              </div>

              <MedicineGrid
                medicines={medicines}
                search={search}
                onSearchChange={setSearch}
                onSelect={handleSelectMedicine}
              />
            </div>

            {/* Right — Cart */}
            <CartPanel
              cart={cart}
              medicines={medicines}
              customers={customers}
              selectedCustomer={selectedCustomer}
              totals={totals}
              discountType={discountState.discountType}
              discountValue={discountState.discountValue}
              paymentMethod={paymentMethod}
              allowLineDiscount={settings.allowLineDiscount}
              allowSplitPayment={settings.allowSplitPayment}
              allowBillDiscount={settings.allowBillDiscount}
              taxRate={settings.taxRate}
              onSetCustomer={setSelectedCustomer}
              onAddNewCustomer={() => setShowAddCustomer(true)}
              onUpdateQty={updateCartQuantity}
              onUpdateItemDiscount={updateCartItemDiscount}
              onRemove={removeFromCart}
              onClearCart={clearCart}
              onDiscountTypeChange={discountState.setDiscountType}
              onDiscountValueChange={discountState.setDiscountValue}
              onPaymentMethodChange={setPaymentMethod}
              onCheckout={handleCheckout}
              onSplitPayment={handleSplitCheckout}
            />
          </>
        ) : (
          <div className="flex-1 p-4 overflow-hidden">
            <SaleHistoryPanel
              sales={sales}
              onViewInvoice={(sale) => {
                setCompletedSale(sale);
                setShowInvoice(true);
              }}
            />
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={totals.total}
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        onConfirm={handleConfirmPayment}
        isLoading={isProcessing}
      />

      <SplitPaymentModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        total={totals.total}
        onConfirm={handleConfirmSplit}
        isLoading={isProcessing}
      />

      {showInvoice && completedSale && (
        <InvoicePrint
          sale={completedSale}
          pharmacyName={settings.pharmacyName}
          pharmacyAddress={settings.address}
          pharmacyPhone={settings.phone}
          onClose={() => { setShowInvoice(false); setCompletedSale(null); }}
        />
      )}

      <QuickAddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onAdd={handleAddCustomer}
      />

      <HeldSalesDrawer
        heldSales={heldSales}
        isOpen={showHeldDrawer}
        onClose={() => setShowHeldDrawer(false)}
        onResume={resumeHeld}
        onDelete={deleteHeld}
      />

      {/* PIN Pad */}
      <PINPadModal isOpen={showPIN} onClose={() => setShowPIN(false)} />

      {/* Cash Shift */}
      <CashShiftModal isOpen={showShift} onClose={() => setShowShift(false)} mode={shiftMode} />

      {/* Prescription */}
      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onSave={setPrescriptionData}
        initial={prescriptionData}
        hasRxItems={cart.some((i) => i.prescriptionRequired)}
      />

      {/* Generic Substitution */}
      <GenericSubstitutionModal
        isOpen={showGenericModal}
        onClose={() => setShowGenericModal(false)}
        sourceMedicine={genericSource}
        substitutes={genericSource ? medicines.filter((m) => m.genericName === genericSource.genericName && m.id !== genericSource.id && m.stock > 0) : []}
        onSelect={(med) => {
          // Remove original from cart, add substitute
          if (genericSource) removeFromCart(genericSource.id);
          addToCart(med);
          toast.success(`Switched to ${med.name}`);
        }}
      />
    </div>
  );
}

// ── Tab button ─────────────────────────────────────────────────────────────────
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

function TabButton({ active, onClick, icon, label, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
