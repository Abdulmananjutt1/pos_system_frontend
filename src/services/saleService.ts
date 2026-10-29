import { Sale } from "@/types";
import { apiGet } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSaleItem(i: any) {
  return {
    medicineId:   i.medicineId   ?? i.medicine_id   ?? "",
    medicineName: i.medicineName ?? i.medicine_name ?? "",
    quantity:     Number(i.quantity  ?? 1),
    unitPrice:    Number(i.unitPrice ?? i.unit_price ?? 0),
    discount:     Number(i.discount  ?? 0),
    total:        Number(i.total     ?? 0),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(s: any): Sale {
  return {
    id:            s.id,
    invoiceNumber: s.invoiceNumber  ?? s.invoice_number  ?? "",
    customerId:    s.customerId     ?? s.customer_id,
    customerName:  s.customerName   ?? s.customer_name   ?? "Walk-in",
    items:         (s.items ?? []).map(mapSaleItem),
    subtotal:      Number(s.subtotal     ?? 0),
    discount:      Number(s.discount     ?? 0),
    tax:           Number(s.tax          ?? 0),
    total:         Number(s.total        ?? 0),
    paymentMethod: s.paymentMethod  ?? s.payment_method  ?? "Cash",
    status:        s.status         ?? "Completed",
    cashierName:   s.cashierName    ?? s.cashier_name    ?? "",
    createdAt:     s.createdAt      ?? s.created_at      ?? "",
  };
}

export interface SaleListResult {
  sales:      Sale[];
  total:      number;
  page:       number;
  totalPages: number;
}

export const saleService = {
  async getAll(params?: {
    search?: string; page?: number; limit?: number;
    status?: string; from?: string; to?: string;
  }): Promise<SaleListResult> {
    const data = await apiGet<{ items: unknown[]; total: number; page: number; totalPages: number }>(
      "/sales",
      {
        search: params?.search,
        page:   params?.page,
        limit:  params?.limit,
        status: params?.status,
        from:   params?.from,
        to:     params?.to,
      }
    );
    return {
      sales:      (data.items ?? []).map(mapSale),
      total:      data.total      ?? 0,
      page:       data.page       ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },
};
