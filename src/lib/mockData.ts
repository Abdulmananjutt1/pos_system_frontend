import { Medicine, Customer, Supplier, Sale, Expense } from "@/types";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const mockMedicines: Medicine[] = [
  {
    id: "MED001",
    name: "Panadol Extra",
    genericName: "Paracetamol 500mg",
    brand: "GSK",
    category: "Tablet",
    batchNumber: "BN2024001",
    expiryDate: "2026-06-30",
    purchasePrice: 18,
    sellingPrice: 25,
    stock: 500,
    minStock: 50,
    unit: "Strip",
    supplierId: "SUP001",
    requiresPrescription: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "MED002",
    name: "Augmentin 625mg",
    genericName: "Amoxicillin + Clavulanic Acid",
    brand: "GSK",
    category: "Tablet",
    batchNumber: "BN2024002",
    expiryDate: "2025-12-31",
    purchasePrice: 180,
    sellingPrice: 220,
    stock: 8,
    minStock: 20,
    unit: "Strip",
    supplierId: "SUP001",
    requiresPrescription: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "MED003",
    name: "Brufen Syrup",
    genericName: "Ibuprofen 100mg/5ml",
    brand: "Abbott",
    category: "Syrup",
    batchNumber: "BN2024003",
    expiryDate: "2025-03-15",
    purchasePrice: 95,
    sellingPrice: 120,
    stock: 35,
    minStock: 20,
    unit: "Bottle",
    supplierId: "SUP002",
    requiresPrescription: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "MED004",
    name: "Risek 20mg",
    genericName: "Omeprazole",
    brand: "Getz Pharma",
    category: "Capsule",
    batchNumber: "BN2024004",
    expiryDate: "2026-09-30",
    purchasePrice: 120,
    sellingPrice: 160,
    stock: 150,
    minStock: 30,
    unit: "Strip",
    supplierId: "SUP002",
    requiresPrescription: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "MED005",
    name: "Glucophage 500mg",
    genericName: "Metformin HCl",
    brand: "Merck",
    category: "Tablet",
    batchNumber: "BN2024005",
    expiryDate: "2027-01-31",
    purchasePrice: 85,
    sellingPrice: 110,
    stock: 200,
    minStock: 40,
    unit: "Strip",
    supplierId: "SUP003",
    requiresPrescription: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "CUS001",
    name: "Ahmed Khan",
    phone: "0300-1234567",
    email: "ahmed@example.com",
    address: "House 12, Block B, Gulshan-e-Iqbal, Karachi",
    totalPurchases: 5600,
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "CUS002",
    name: "Fatima Ali",
    phone: "0321-9876543",
    address: "Flat 5, Al-Noor Apartments, Lahore",
    totalPurchases: 3200,
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "CUS003",
    name: "Muhammad Usman",
    phone: "0333-4567890",
    email: "usman@example.com",
    address: "Street 7, I-8/3, Islamabad",
    totalPurchases: 8900,
    createdAt: "2024-03-01T00:00:00Z",
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: "SUP001",
    name: "GSK Pakistan Ltd",
    contactPerson: "Zafar Iqbal",
    phone: "021-35870000",
    email: "supply@gsk.pk",
    address: "Plot 23, SITE Industrial Area, Karachi",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "SUP002",
    name: "Abbott Laboratories",
    contactPerson: "Sara Malik",
    phone: "042-35761234",
    email: "orders@abbott.pk",
    address: "17-km, Ferozepur Road, Lahore",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "SUP003",
    name: "Getz Pharma",
    contactPerson: "Kamran Siddiqui",
    phone: "021-34380000",
    email: "procurement@getzpharma.com",
    address: "Plot 68, Korangi Industrial Area, Karachi",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

export const mockSales: Sale[] = [
  // Today
  {
    id: "SAL001",
    invoiceNumber: "INV-241001-1234",
    customerId: "CUS001",
    customerName: "Ahmed Khan",
    items: [
      { medicineId: "MED001", medicineName: "Panadol Extra", quantity: 3, unitPrice: 25, discount: 0, total: 75 },
      { medicineId: "MED004", medicineName: "Risek 20mg", quantity: 1, unitPrice: 160, discount: 0, total: 160 },
    ],
    subtotal: 235, discount: 0, tax: 0, total: 235,
    paymentMethod: "Cash", status: "Completed",
    createdAt: new Date().toISOString(), cashierName: "Admin",
  },
  {
    id: "SAL002",
    invoiceNumber: "INV-241001-2345",
    customerName: "Walk-in Customer",
    items: [
      { medicineId: "MED002", medicineName: "Augmentin 625mg", quantity: 2, unitPrice: 220, discount: 0, total: 440 },
    ],
    subtotal: 440, discount: 20, tax: 0, total: 420,
    paymentMethod: "Card", status: "Completed",
    createdAt: new Date().toISOString(), cashierName: "Admin",
  },
  // Yesterday
  {
    id: "SAL003",
    invoiceNumber: "INV-240930-5678",
    customerId: "CUS002",
    customerName: "Fatima Ali",
    items: [
      { medicineId: "MED003", medicineName: "Brufen Syrup", quantity: 2, unitPrice: 120, discount: 0, total: 240 },
      { medicineId: "MED005", medicineName: "Glucophage 500mg", quantity: 1, unitPrice: 110, discount: 0, total: 110 },
    ],
    subtotal: 350, discount: 0, tax: 0, total: 350,
    paymentMethod: "JazzCash", status: "Completed",
    createdAt: daysAgo(1), cashierName: "Admin",
  },
  // 2 days ago
  {
    id: "SAL004",
    invoiceNumber: "INV-240929-9012",
    customerId: "CUS003",
    customerName: "Muhammad Usman",
    items: [
      { medicineId: "MED001", medicineName: "Panadol Extra", quantity: 5, unitPrice: 25, discount: 0, total: 125 },
      { medicineId: "MED002", medicineName: "Augmentin 625mg", quantity: 1, unitPrice: 220, discount: 0, total: 220 },
    ],
    subtotal: 345, discount: 0, tax: 0, total: 345,
    paymentMethod: "Cash", status: "Completed",
    createdAt: daysAgo(2), cashierName: "Admin",
  },
  // 3 days ago
  {
    id: "SAL005",
    invoiceNumber: "INV-240928-3456",
    customerName: "Walk-in Customer",
    items: [
      { medicineId: "MED004", medicineName: "Risek 20mg", quantity: 2, unitPrice: 160, discount: 0, total: 320 },
    ],
    subtotal: 320, discount: 0, tax: 0, total: 320,
    paymentMethod: "Cash", status: "Completed",
    createdAt: daysAgo(3), cashierName: "Admin",
  },
  // 5 days ago
  {
    id: "SAL006",
    invoiceNumber: "INV-240926-7890",
    customerId: "CUS001",
    customerName: "Ahmed Khan",
    items: [
      { medicineId: "MED005", medicineName: "Glucophage 500mg", quantity: 3, unitPrice: 110, discount: 0, total: 330 },
    ],
    subtotal: 330, discount: 30, tax: 0, total: 300,
    paymentMethod: "Card", status: "Completed",
    createdAt: daysAgo(5), cashierName: "Admin",
  },
  // 7 days ago
  {
    id: "SAL007",
    invoiceNumber: "INV-240924-1111",
    customerName: "Walk-in Customer",
    items: [
      { medicineId: "MED001", medicineName: "Panadol Extra", quantity: 4, unitPrice: 25, discount: 0, total: 100 },
      { medicineId: "MED003", medicineName: "Brufen Syrup", quantity: 1, unitPrice: 120, discount: 0, total: 120 },
    ],
    subtotal: 220, discount: 0, tax: 0, total: 220,
    paymentMethod: "EasyPaisa", status: "Completed",
    createdAt: daysAgo(7), cashierName: "Admin",
  },
];

export const mockExpenses: Expense[] = [
  {
    id: "EXP001",
    description: "Electricity Bill",
    amount: 8500,
    category: "Utilities",
    date: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "EXP002",
    description: "Staff Salary",
    amount: 45000,
    category: "Salaries",
    date: daysAgo(1).split("T")[0],
    createdAt: daysAgo(1),
  },
  {
    id: "EXP003",
    description: "Rent",
    amount: 25000,
    category: "Rent",
    date: daysAgo(3).split("T")[0],
    createdAt: daysAgo(3),
  },
  {
    id: "EXP004",
    description: "Cleaning Supplies",
    amount: 1200,
    category: "Supplies",
    date: daysAgo(5).split("T")[0],
    createdAt: daysAgo(5),
  },
];
