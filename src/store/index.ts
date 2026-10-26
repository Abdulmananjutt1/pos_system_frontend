import { create } from "zustand";
import {
  Medicine, MedicineBatch, Customer, Supplier, Sale, SaleItem, SaleReturn,
  HeldSale, Expense, AppSettings, SplitPaymentEntry,
  PurchaseOrder, PurchaseOrderItem, StockTransfer, StockTransferItem,
  StockCount, StockCountItem, CashShift, ShiftEntry,
  User, LoginHistoryEntry, PaymentMethod,
} from "@/types";
import {
  mockMedicines, mockCustomers, mockSuppliers, mockSales, mockExpenses,
} from "@/lib/mockData";
import { DEFAULT_SETTINGS, MOCK_USERS } from "@/lib/constants";
import { generateId, generateInvoiceNumber } from "@/lib/utils";

// ─── Store Interface ───────────────────────────────────────────────────────────
interface PharmacyStore {
  // ── Core data ─────────────────────────────────────────────────────────────
  medicines: Medicine[];
  medicineBatches: MedicineBatch[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  returns: SaleReturn[];
  expenses: Expense[];
  heldSales: HeldSale[];
  purchaseOrders: PurchaseOrder[];
  stockTransfers: StockTransfer[];
  stockCounts: StockCount[];
  cashShifts: CashShift[];
  currentShift: CashShift | null;
  users: User[];
  currentUser: User | null;
  loginHistory: LoginHistoryEntry[];
  settings: AppSettings;

  // ── POS Cart ──────────────────────────────────────────────────────────────
  cart: SaleItem[];
  selectedCustomer: Customer | null;
  cartDiscount: number;

  // ── Auth actions ──────────────────────────────────────────────────────────
  login: (username: string, password: string) => boolean;
  loginWithPin: (pin: string) => User | null;
  logout: () => void;
  addUser: (u: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // ── Medicine actions ──────────────────────────────────────────────────────
  addMedicine: (m: Omit<Medicine, "id" | "createdAt" | "updatedAt">) => void;
  updateMedicine: (id: string, m: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  adjustStock: (id: string, adjustment: number) => void;

  // ── Batch actions ─────────────────────────────────────────────────────────
  addBatch: (b: Omit<MedicineBatch, "id" | "createdAt">) => void;
  updateBatch: (id: string, b: Partial<MedicineBatch>) => void;
  deleteBatch: (id: string) => void;

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
    splitPayments?: SplitPaymentEntry[],
    extra?: { doctorName?: string; patientName?: string; prescriptionNote?: string; isCredit?: boolean }
  ) => Sale | null;
  refundSale: (saleId: string) => void;
  processReturn: (ret: Omit<SaleReturn, "id" | "returnNumber" | "createdAt">) => SaleReturn;

  // ── Expense actions ───────────────────────────────────────────────────────
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;

  // ── Purchase Order actions ────────────────────────────────────────────────
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt">) => PurchaseOrder;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  receivePurchaseOrder: (poId: string, items: PurchaseOrderItem[]) => void;
  deletePurchaseOrder: (id: string) => void;

  // ── Stock Transfer actions ────────────────────────────────────────────────
  addStockTransfer: (t: Omit<StockTransfer, "id" | "transferNumber" | "createdAt">) => StockTransfer;
  updateTransferStatus: (id: string, status: StockTransfer["status"]) => void;
  receiveStockTransfer: (id: string) => void;

  // ── Stock Count actions ───────────────────────────────────────────────────
  startStockCount: () => StockCount;
  updateStockCountItem: (countId: string, medicineId: string, physicalCount: number) => void;
  finalizeStockCount: (countId: string) => void;
  deleteStockCount: (id: string) => void;

  // ── Cash Shift actions ────────────────────────────────────────────────────
  openShift: (openingBalance: number) => CashShift;
  closeShift: (closingBalance: number, notes?: string) => void;
  addShiftEntry: (entry: Omit<ShiftEntry, "time">) => void;

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (s: Partial<AppSettings>) => void;
}

// ─── Store Implementation ──────────────────────────────────────────────────────
export const usePharmacyStore = create<PharmacyStore>((set, get) => ({
  medicines: mockMedicines,
  medicineBatches: [],
  customers: mockCustomers,
  suppliers: mockSuppliers,
  sales: mockSales,
  returns: [],
  expenses: mockExpenses,
  heldSales: [],
  purchaseOrders: [],
  stockTransfers: [],
  stockCounts: [],
  cashShifts: [],
  currentShift: null,
  users: MOCK_USERS,
  currentUser: MOCK_USERS[0], // start logged in as admin for dev
  loginHistory: [],
  settings: DEFAULT_SETTINGS,
  cart: [],
  selectedCustomer: null,
  cartDiscount: 0,

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (username, password) => {
    const user = get().users.find(
      (u) =>
        (u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === username.toLowerCase()) &&
        u.isActive
    );
    // simple plaintext password check — replace with real auth
    if (!user || password !== "admin123") return false;
    const entry: LoginHistoryEntry = {
      id: `LH${generateId()}`,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      action: "Login",
      time: new Date().toISOString(),
    };
    set((s) => ({
      currentUser: user,
      loginHistory: [entry, ...s.loginHistory],
    }));
    return true;
  },

  loginWithPin: (pin) => {
    const user = get().users.find((u) => u.pin === pin && u.isActive);
    if (!user) return null;
    const entry: LoginHistoryEntry = {
      id: `LH${generateId()}`,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      action: "PIN Switch",
      time: new Date().toISOString(),
    };
    set((s) => ({
      currentUser: user,
      loginHistory: [entry, ...s.loginHistory],
    }));
    return user;
  },

  logout: () => {
    const { currentUser } = get();
    if (currentUser) {
      const entry: LoginHistoryEntry = {
        id: `LH${generateId()}`,
        userId: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        action: "Logout",
        time: new Date().toISOString(),
      };
      set((s) => ({
        loginHistory: [entry, ...s.loginHistory],
        currentUser: null,
      }));
    }
  },

  addUser: (userData) =>
    set((s) => ({
      users: [
        ...s.users,
        { ...userData, id: `USR${generateId()}`, createdAt: new Date().toISOString() },
      ],
    })),

  updateUser: (id, updates) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),

  deleteUser: (id) =>
    set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

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

  // ── Batches ───────────────────────────────────────────────────────────────
  addBatch: (batch) => {
    const newBatch: MedicineBatch = {
      ...batch,
      id: `BAT${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      medicineBatches: [...s.medicineBatches, newBatch],
      medicines: s.medicines.map((m) =>
        m.id === batch.medicineId
          ? {
              ...m,
              stock: m.stock + batch.quantity,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              purchasePrice: batch.purchasePrice,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    }));
  },

  updateBatch: (id, updates) =>
    set((s) => ({
      medicineBatches: s.medicineBatches.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  deleteBatch: (id) =>
    set((s) => ({ medicineBatches: s.medicineBatches.filter((b) => b.id !== id) })),

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
      // FEFO: pick earliest-expiry batch with stock
      const batches = state.medicineBatches
        .filter((b) => b.medicineId === medicine.id && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      const batch = batches[0];
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
            batchId: batch?.id,
            expiryDate: batch?.expiryDate ?? medicine.expiryDate,
            prescriptionRequired: medicine.requiresPrescription,
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
  completeSale: (paymentMethod, discount = 0, splitPayments, extra = {}) => {
    const { cart, selectedCustomer, medicines, sales, settings, currentUser, currentShift } = get();
    if (cart.length === 0) return null;

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
      splitPayments,
      status: "Completed",
      cashierName: currentUser?.name ?? "Admin",
      shiftId: currentShift?.id,
      ...extra,
      createdAt: new Date().toISOString(),
    };

    // Deduct stock from medicines
    const updatedMedicines = medicines.map((med) => {
      const cartItem = cart.find((i) => i.medicineId === med.id);
      return cartItem
        ? { ...med, stock: Math.max(0, med.stock - cartItem.quantity) }
        : med;
    });

    // Deduct from batches (FEFO)
    const updatedBatches = [...get().medicineBatches];
    cart.forEach((item) => {
      if (item.batchId) {
        const idx = updatedBatches.findIndex((b) => b.id === item.batchId);
        if (idx !== -1) {
          updatedBatches[idx] = {
            ...updatedBatches[idx],
            quantity: Math.max(0, updatedBatches[idx].quantity - item.quantity),
          };
        }
      }
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
      medicineBatches: updatedBatches,
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

  processReturn: (ret) => {
    const newReturn: SaleReturn = {
      ...ret,
      id: `RET${generateId()}`,
      returnNumber: `RET-${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    // Restock returned items
    const stockUpdates: Record<string, number> = {};
    ret.items.forEach((item) => {
      if (item.condition === "Good") {
        stockUpdates[item.medicineId] = (stockUpdates[item.medicineId] || 0) + item.returnQuantity;
      }
    });
    set((s) => ({
      returns: [newReturn, ...s.returns],
      medicines: s.medicines.map((m) =>
        stockUpdates[m.id] ? { ...m, stock: m.stock + stockUpdates[m.id] } : m
      ),
      sales: s.sales.map((sale) =>
        sale.id === ret.saleId ? { ...sale, status: "Refunded" as const } : sale
      ),
    }));
    return newReturn;
  },

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

  // ── Purchase Orders ───────────────────────────────────────────────────────
  addPurchaseOrder: (po) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: `PO${generateId()}`,
      poNumber: `PO-${new Date().getFullYear()}-${generateId().slice(0, 4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ purchaseOrders: [newPO, ...s.purchaseOrders] }));
    return newPO;
  },

  updatePurchaseOrder: (id, updates) =>
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((po) =>
        po.id === id ? { ...po, ...updates, updatedAt: new Date().toISOString() } : po
      ),
    })),

  receivePurchaseOrder: (poId, items) => {
    const { addBatch, medicines } = get();
    items.forEach((item) => {
      if (item.batchNumber && item.expiryDate && item.receivedQuantity > 0) {
        const med = medicines.find((m) => m.id === item.medicineId);
        addBatch({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          purchasePrice: item.unitPrice,
          sellingPrice: med?.sellingPrice ?? item.unitPrice,
          quantity: item.receivedQuantity,
        });
      }
    });
    set((s) => ({
      purchaseOrders: s.purchaseOrders.map((po) =>
        po.id === poId
          ? { ...po, status: "Received" as const, updatedAt: new Date().toISOString() }
          : po
      ),
    }));
  },

  deletePurchaseOrder: (id) =>
    set((s) => ({ purchaseOrders: s.purchaseOrders.filter((po) => po.id !== id) })),

  // ── Stock Transfers ───────────────────────────────────────────────────────
  addStockTransfer: (t) => {
    const newTransfer: StockTransfer = {
      ...t,
      id: `TRF${generateId()}`,
      transferNumber: `TRF-${generateId().slice(0, 6)}`,
      createdAt: new Date().toISOString(),
    };
    // Deduct stock from sender
    const stockDelta: Record<string, number> = {};
    t.items.forEach((i) => { stockDelta[i.medicineId] = (stockDelta[i.medicineId] || 0) - i.quantity; });
    set((s) => ({
      stockTransfers: [newTransfer, ...s.stockTransfers],
      medicines: s.medicines.map((m) =>
        stockDelta[m.id] !== undefined
          ? { ...m, stock: Math.max(0, m.stock + stockDelta[m.id]) }
          : m
      ),
    }));
    return newTransfer;
  },

  updateTransferStatus: (id, status) =>
    set((s) => ({
      stockTransfers: s.stockTransfers.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  receiveStockTransfer: (id) => {
    const transfer = get().stockTransfers.find((t) => t.id === id);
    if (!transfer) return;
    const stockDelta: Record<string, number> = {};
    transfer.items.forEach((i) => { stockDelta[i.medicineId] = (stockDelta[i.medicineId] || 0) + i.quantity; });
    set((s) => ({
      stockTransfers: s.stockTransfers.map((t) =>
        t.id === id ? { ...t, status: "Received" as const, receiveDate: new Date().toISOString() } : t
      ),
      medicines: s.medicines.map((m) =>
        stockDelta[m.id] !== undefined
          ? { ...m, stock: m.stock + stockDelta[m.id] }
          : m
      ),
    }));
  },

  // ── Stock Count ───────────────────────────────────────────────────────────
  startStockCount: () => {
    const { medicines } = get();
    const items: StockCountItem[] = medicines.map((m) => ({
      medicineId: m.id,
      medicineName: m.name,
      batchNumber: m.batchNumber,
      systemStock: m.stock,
      physicalCount: null,
      variance: 0,
    }));
    const count: StockCount = {
      id: `SC${generateId()}`,
      countNumber: `CNT-${generateId().slice(0, 6)}`,
      countDate: new Date().toISOString().split("T")[0],
      status: "InProgress",
      items,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ stockCounts: [count, ...s.stockCounts] }));
    return count;
  },

  updateStockCountItem: (countId, medicineId, physicalCount) =>
    set((s) => ({
      stockCounts: s.stockCounts.map((c) =>
        c.id === countId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.medicineId === medicineId
                  ? { ...i, physicalCount, variance: physicalCount - i.systemStock }
                  : i
              ),
            }
          : c
      ),
    })),

  finalizeStockCount: (countId) => {
    const count = get().stockCounts.find((c) => c.id === countId);
    if (!count) return;
    // Apply adjustments for counted items
    const adjustments: Record<string, number> = {};
    count.items.forEach((i) => {
      if (i.physicalCount !== null && i.variance !== 0) {
        adjustments[i.medicineId] = i.variance;
      }
    });
    set((s) => ({
      stockCounts: s.stockCounts.map((c) =>
        c.id === countId ? { ...c, status: "Verified" as const } : c
      ),
      medicines: s.medicines.map((m) =>
        adjustments[m.id] !== undefined
          ? { ...m, stock: Math.max(0, m.stock + adjustments[m.id]) }
          : m
      ),
    }));
  },

  deleteStockCount: (id) =>
    set((s) => ({ stockCounts: s.stockCounts.filter((c) => c.id !== id) })),

  // ── Cash Shift ────────────────────────────────────────────────────────────
  openShift: (openingBalance) => {
    const { currentUser } = get();
    const shift: CashShift = {
      id: `SHF${generateId()}`,
      shiftNumber: `SHF-${generateId().slice(0, 6)}`,
      openedBy: currentUser?.name ?? "Admin",
      openTime: new Date().toISOString(),
      openingBalance,
      cashEntries: [],
      status: "Open",
    };
    set((s) => ({ cashShifts: [shift, ...s.cashShifts], currentShift: shift }));
    return shift;
  },

  closeShift: (closingBalance, notes) => {
    const { currentShift, sales, currentUser } = get();
    if (!currentShift) return;
    const shiftSales = sales.filter(
      (s) => s.shiftId === currentShift.id && s.paymentMethod === "Cash"
    );
    const cashSales = shiftSales.reduce((sum, s) => sum + s.total, 0);
    const expectedCash = currentShift.openingBalance + cashSales;
    const variance = closingBalance - expectedCash;
    const closed: CashShift = {
      ...currentShift,
      closedBy: currentUser?.name,
      closeTime: new Date().toISOString(),
      closingBalance,
      expectedCash,
      variance,
      status: "Closed",
      notes,
    };
    set((s) => ({
      cashShifts: s.cashShifts.map((sh) => (sh.id === currentShift.id ? closed : sh)),
      currentShift: null,
    }));
  },

  addShiftEntry: (entry) => {
    const { currentShift } = get();
    if (!currentShift) return;
    const fullEntry: ShiftEntry = { ...entry, time: new Date().toISOString() };
    const updated: CashShift = {
      ...currentShift,
      cashEntries: [...currentShift.cashEntries, fullEntry],
    };
    set((s) => ({
      currentShift: updated,
      cashShifts: s.cashShifts.map((sh) => (sh.id === currentShift.id ? updated : sh)),
    }));
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),
}));
