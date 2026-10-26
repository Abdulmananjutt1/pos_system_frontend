// ─── Medicine / Product ───────────────────────────────────────────────────────
export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: MedicineCategory;
  batchNumber: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  supplierId: string;
  description?: string;
  requiresPrescription: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MedicineCategory =
  | "Tablet"
  | "Capsule"
  | "Syrup"
  | "Injection"
  | "Cream"
  | "Drops"
  | "Inhaler"
  | "Supplement"
  | "Other";

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  createdAt: string;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  createdAt: string;
}

// ─── Sale / Invoice ───────────────────────────────────────────────────────────
export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  createdAt: string;
  cashierName: string;
}

export type PaymentMethod = "Cash" | "Card" | "UBL" | "JazzCash" | "EasyPaisa";
export type SaleStatus = "Completed" | "Pending" | "Refunded" | "Held";

// ─── Split Payment ────────────────────────────────────────────────────────────
export interface SplitPaymentEntry {
  method: PaymentMethod;
  amount: number;
}

// ─── Held Sale ────────────────────────────────────────────────────────────────
export interface HeldSale {
  id: string;
  label: string;
  cart: SaleItem[];
  customerId?: string;
  customerName: string;
  discount: number;
  heldAt: string;
}

// ─── Expense ──────────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export type ThemeColor = "blue" | "purple" | "green" | "rose" | "orange" | "teal" | "black";

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  pharmacyName: string;
  address: string;
  phone: string;
  taxRate: number;           // 0–1 (e.g. 0.17 for 17%)
  invoicePrefix: string;     // e.g. "INV"
  currency: string;
  lowStockThreshold: number;
  receiptTemplate: "thermal" | "a4";
  allowLineDiscount: boolean;
  allowBillDiscount: boolean;
  allowSplitPayment: boolean;
  allowHoldSale: boolean;
  themeColor: ThemeColor;
}

// ─── Branch ───────────────────────────────────────────────────────────────────
export interface Branch {
  id: string;
  name: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalMedicines: number;
  lowStockItems: number;
  expiringItems: number;
  totalCustomers: number;
}

// ─── Table Column ─────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}
