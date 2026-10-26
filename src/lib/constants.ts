import { AppSettings, MedicineCategory, PaymentMethod, User } from "@/types";

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
  "Credit",
];

export const NAV_ITEMS = [
  { label: "Dashboard",        href: "/",                icon: "LayoutDashboard" },
  { label: "Point of Sale",    href: "/sales",           icon: "ShoppingCart"    },
  { label: "Inventory",        href: "/inventory",       icon: "Package"         },
  { label: "Medicines",        href: "/medicines",       icon: "Pill"            },
  { label: "Purchase Orders",  href: "/purchase-orders", icon: "ClipboardList"   },
  { label: "Customers",        href: "/customers",       icon: "Users"           },
  { label: "Suppliers",        href: "/suppliers",       icon: "Truck"           },
  { label: "Stock Count",      href: "/stock-count",     icon: "ClipboardCheck"  },
  { label: "Transfers",        href: "/transfers",       icon: "ArrowLeftRight"  },
  { label: "Returns",          href: "/returns",         icon: "RotateCcw"       },
  { label: "Reports",          href: "/reports",         icon: "BarChart2"       },
  { label: "Login History",    href: "/login-history",   icon: "Clock"           },
  { label: "Settings",         href: "/settings",        icon: "Settings"        },
] as const;

export const LOW_STOCK_THRESHOLD = 10;
export const EXPIRY_WARNING_DAYS = 30;

export const DEFAULT_SETTINGS: AppSettings = {
  pharmacyName: "Al-Shifa Pharmacy",
  address: "Main Market, Karachi",
  phone: "021-12345678",
  licenseNumber: "",
  taxNumber: "",
  footerText: "Thank you for your purchase!",
  taxRate: 0,
  invoicePrefix: "INV",
  currency: "PKR",
  lowStockThreshold: 10,
  expiryWarnDays: 90,
  receiptTemplate: "thermal",
  allowLineDiscount: true,
  allowBillDiscount: true,
  allowSplitPayment: true,
  allowHoldSale: true,
  allowCreditSales: true,
  requireRxUpload: false,
  autoLogoutMinutes: 30,
  themeColor: "blue",
  branches: ["Main Branch"],
  currentBranch: "Main Branch",
};

// kept for backwards compat
export const TAX_RATE = 0;

// ─── Mock users for development ───────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  {
    id: "USR001",
    username: "admin",
    name: "Admin User",
    email: "admin@pharmacy.com",
    role: "Admin",
    pin: "1234",
    isActive: true,
    branch: "Main Branch",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "USR002",
    username: "cashier1",
    name: "Ali Hassan",
    email: "ali@pharmacy.com",
    role: "Cashier",
    pin: "5678",
    isActive: true,
    branch: "Main Branch",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "USR003",
    username: "manager",
    name: "Sara Khan",
    email: "sara@pharmacy.com",
    role: "Manager",
    pin: "9999",
    isActive: true,
    branch: "Main Branch",
    createdAt: "2024-01-01T00:00:00Z",
  },
];
