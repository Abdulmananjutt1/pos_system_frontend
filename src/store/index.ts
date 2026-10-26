import { create } from "zustand";
import {
  Medicine, Customer, Supplier, Sale, SaleItem,
  HeldSale, Expense, AppSettings, SplitPaymentEntry,
} from "@/types";
import {
  mockMedicines, mockCustomers, mockSuppliers, mockSales, mockExpenses,
} from "@/lib/mockData";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { generateId, generateInvoiceNumber } from "@/lib/utils";

// ─── Store Interface ───────────────────────────────────────────────────────────
interface PharmacyStore {
  // ── Data ──────────────────────────────────────────────────────────────────
  medicines: Medicine[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  expenses: Expense[];
  heldSales: HeldSale[];
  settings: AppSettings;

  // ── POS Cart ──────────────────────────────────────────────────────────────
  cart: SaleItem[];
  selectedCustomer: Customer | null;
  cartDiscount: number;            // bill-level discount amount (PKR)

  // ── Medicine actions ──────────────────────────────────────────────────────
  addMedicine: (m: Omit<Medicine, "id" | "createdAt" | "updatedAt">) => void;
  updateMedicine: (id: string, m: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  adjustStock: (id: string, adjustment: number) => void;

  // ── Customer actions ──────────────────────────────────────────────────────
  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "totalPurchases">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // ── Supplier actions ──────────────────────────────────────────────────────
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // ── Cart actions ──────────────────────────────────────────────────────────
  addToCart: (medicine: Medicine, quantity?: number) => void;
  removeFromCart: (medicineId: string) => void;
  updateCartQuantity: (medicineId: string, quantity: number) => void;
  updateCartItemDiscount: (medicineId: string, discount: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setCartDiscount: (amount: number) => void;

  // ── Hold / Resume ─────────────────────────────────────────────────────────
  holdSale: (label?: string) => void;
  resumeHeld: (heldId: string) => void;
  deleteHeld: (heldId: string) => void;

  // ── Sale actions ──────────────────────────────────────────────────────────
  completeSale: (
    paymentMethod: string,
    discount?: number,
    splitPayments?: SplitPaymentEntry[]
  ) => Sale | null;
  refundSale: (saleId: string) => void;

  // ── Expense actions ───────────────────────────────────────────────────────
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (s: Partial<AppSettings>) => void;
}

// ─── Store Implementation ──────────────────────────────────────────────────────
export const usePharmacyStore = create<PharmacyStore>((set, get) => ({
  medicines: mockMedicines,
  customers: mockCustomers,
  suppliers: mockSuppliers,
  sales: mockSales,
  expenses: mockExpenses,
  heldSales: [],
  settings: DEFAULT_SETTINGS,
  cart: [],
  selectedCustomer: null,
  cartDiscount: 0,

  // ── Medicine ──────────────────────────────────────────────────────────────
  addMedicine: (medicine) =>
    set((state) => ({
      medicines: [
        ...state.medicines,
        {
          ...medicine,
          id: `MED${generateId()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  updateMedicine: (id, updates) =>
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
    })),

  deleteMedicine: (id) =>
    set((state) => ({
      medicines: state.medicines.filter((m) => m.id !== id),
    })),

  adjustStock: (id, adjustment) =>
    set((state) => ({
      medicines: state.medicines.map((m) =>
        m.id === id
          ? { ...m, stock: Math.max(0, m.stock + adjustment), updatedAt: new Date().toISOString() }
          : m
      ),
    })),

  // ── Customer ──────────────────────────────────────────────────────────────
  addCustomer: (customer) =>
    set((state) => ({
      customers: [
        ...state.customers,
        { ...customer, id: `CUS${generateId()}`, totalPurchases: 0, createdAt: new Date().toISOString() },
      ],
    })),

  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  deleteCustomer: (id) =>
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),

  // ── Supplier ──────────────────────────────────────────────────────────────
  addSupplier: (supplier) =>
    set((state) => ({
      suppliers: [
        ...state.suppliers,
        { ...supplier, id: `SUP${generateId()}`, createdAt: new Date().toISOString() },
      ],
    })),

  updateSupplier: (id, updates) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteSupplier: (id) =>
    set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) })),

  // ── Cart ──────────────────────────────────────────────────────────────────
  addToCart: (medicine, quantity = 1) =>
    set((state) => {
      const existing = state.cart.find((i) => i.medicineId === medicine.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.medicineId === medicine.id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  total: (i.quantity + quantity) * i.unitPrice * (1 - i.discount / 100),
                }
              : i
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity,
            unitPrice: medicine.sellingPrice,
            discount: 0,
            total: quantity * medicine.sellingPrice,
          },
        ],
      };
    }),

  removeFromCart: (medicineId) =>
    set((state) => ({ cart: state.cart.filter((i) => i.medicineId !== medicineId) })),

  updateCartQuantity: (medicineId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((i) => i.medicineId !== medicineId)
          : state.cart.map((i) =>
              i.medicineId === medicineId
                ? { ...i, quantity, total: quantity * i.unitPrice * (1 - i.discount / 100) }
                : i
            ),
    })),

  updateCartItemDiscount: (medicineId, discount) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        i.medicineId === medicineId
          ? {
              ...i,
              discount: Math.max(0, Math.min(100, discount)),
              total: i.quantity * i.unitPrice * (1 - Math.max(0, Math.min(100, discount)) / 100),
            }
          : i
      ),
    })),

  clearCart: () => set({ cart: [], selectedCustomer: null, cartDiscount: 0 }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

  setCartDiscount: (amount) => set({ cartDiscount: amount }),

  // ── Hold / Resume ─────────────────────────────────────────────────────────
  holdSale: (label) => {
    const { cart, selectedCustomer, cartDiscount } = get();
    if (cart.length === 0) return;
    const held: HeldSale = {
      id: `HLD${generateId()}`,
      label: label || `Hold #${Date.now()}`,
      cart: [...cart],
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || "Walk-in",
      discount: cartDiscount,
      heldAt: new Date().toISOString(),
    };
    set((state) => ({
      heldSales: [held, ...state.heldSales],
      cart: [],
      selectedCustomer: null,
      cartDiscount: 0,
    }));
  },

  resumeHeld: (heldId) => {
    const { heldSales, customers } = get();
    const held = heldSales.find((h) => h.id === heldId);
    if (!held) return;
    const customer = held.customerId
      ? customers.find((c) => c.id === held.customerId) ?? null
      : null;
    set((state) => ({
      cart: [...held.cart],
      selectedCustomer: customer,
      cartDiscount: held.discount,
      heldSales: state.heldSales.filter((h) => h.id !== heldId),
    }));
  },

  deleteHeld: (heldId) =>
    set((state) => ({ heldSales: state.heldSales.filter((h) => h.id !== heldId) })),

  // ── Complete Sale ──────────────────────────────────────────────────────────
  completeSale: (paymentMethod, discount = 0, splitPayments) => {
    const { cart, selectedCustomer, medicines, sales, settings } = get();
    if (cart.length === 0) return null;

    // Idempotency: prevent duplicate invoice within same second
    const recentInvoice = sales.find(
      (s) => Math.abs(new Date(s.createdAt).getTime() - Date.now()) < 2000
    );
    if (recentInvoice) return recentInvoice;

    const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    const taxAmount = (subtotal - discount) * settings.taxRate;
    const total = subtotal - discount + taxAmount;

    const sale: Sale = {
      id: `SAL${generateId()}`,
      invoiceNumber: generateInvoiceNumber(settings.invoicePrefix),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || "Walk-in Customer",
      items: [...cart],
      subtotal,
      discount,
      tax: taxAmount,
      total,
      paymentMethod: paymentMethod as Sale["paymentMethod"],
      status: "Completed",
      createdAt: new Date().toISOString(),
      cashierName: "Admin",
    };

    // Deduct stock
    const updatedMedicines = medicines.map((med) => {
      const cartItem = cart.find((i) => i.medicineId === med.id);
      return cartItem
        ? { ...med, stock: Math.max(0, med.stock - cartItem.quantity) }
        : med;
    });

    // Update customer total purchases
    let updatedCustomers = get().customers;
    if (selectedCustomer) {
      updatedCustomers = updatedCustomers.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, totalPurchases: c.totalPurchases + total }
          : c
      );
    }

    set((state) => ({
      sales: [sale, ...state.sales],
      medicines: updatedMedicines,
      customers: updatedCustomers,
      cart: [],
      selectedCustomer: null,
      cartDiscount: 0,
    }));

    return sale;
  },

  refundSale: (saleId) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === saleId ? { ...s, status: "Refunded" } : s
      ),
    })),

  // ── Expenses ──────────────────────────────────────────────────────────────
  addExpense: (expense) =>
    set((state) => ({
      expenses: [
        ...state.expenses,
        { ...expense, id: `EXP${generateId()}`, createdAt: new Date().toISOString() },
      ],
    })),

  deleteExpense: (id) =>
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
}));
