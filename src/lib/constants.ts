import { AppSettings, MedicineCategory, PaymentMethod } from "@/types";

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Drops",
  "Inhaler",
  "Supplement",
  "Other",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Card",
  "UBL",
  "JazzCash",
  "EasyPaisa",
];

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Point of Sale", href: "/sales", icon: "ShoppingCart" },
  { label: "Inventory", href: "/inventory", icon: "Package" },
  { label: "Medicines", href: "/medicines", icon: "Pill" },
  { label: "Customers", href: "/customers", icon: "Users" },
  { label: "Suppliers", href: "/suppliers", icon: "Truck" },
  { label: "Reports", href: "/reports", icon: "BarChart2" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const LOW_STOCK_THRESHOLD = 10;
export const EXPIRY_WARNING_DAYS = 30;

export const DEFAULT_SETTINGS: AppSettings = {
  pharmacyName: "Al-Shifa Pharmacy",
  address: "Main Market, Karachi",
  phone: "021-12345678",
  taxRate: 0,
  invoicePrefix: "INV",
  currency: "PKR",
  lowStockThreshold: 10,
  receiptTemplate: "thermal",
  allowLineDiscount: true,
  allowBillDiscount: true,
  allowSplitPayment: true,
  allowHoldSale: true,
  themeColor: "blue",
};

// kept for backwards compat
export const TAX_RATE = 0;
