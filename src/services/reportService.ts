import { apiGet } from "@/lib/apiClient";

export interface ReportSummary {
  totalRevenue:   number;
  totalSales:     number;
  avgOrderValue:  number;
  totalDiscount:  number;
  totalReturns:   number;
  totalRefunded:  number;
  totalCustomers: number;
  totalMedicines: number;
}

export interface PaymentBreakdown {
  method:  string;
  count:   number;
  revenue: number;
}

export interface TopMedicine {
  medicineId: string;
  name:       string;
  qty:        number;
  revenue:    number;
}

export interface RecentSale {
  id:            string;
  invoiceNumber: string;
  customerName:  string;
  total:         number;
  discount:      number;
  paymentMethod: string;
  status:        string;
  itemCount:     number;
  createdAt:     string;
}

export interface ReportData {
  summary:          ReportSummary;
  paymentBreakdown: PaymentBreakdown[];
  topMedicines:     TopMedicine[];
  recentSales:      RecentSale[];
}

export const reportService = {
  async getSummary(params?: { from?: string; to?: string }): Promise<ReportData> {
    return apiGet<ReportData>("/reports/summary", {
      from: params?.from,
      to:   params?.to,
    });
  },
};
