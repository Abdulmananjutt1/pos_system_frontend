import { SaleReturn, ReturnItem, PaymentMethod } from "@/types";
import { apiGet, apiPost } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReturnItem(i: any): ReturnItem {
  return {
    medicineId:     i.medicineId    ?? i.medicine_id    ?? "",
    medicineName:   i.medicineName  ?? i.medicine_name  ?? "",
    saleQuantity:   Number(i.saleQuantity   ?? i.sale_quantity   ?? 0),
    returnQuantity: Number(i.returnQuantity ?? i.return_quantity ?? 0),
    unitPrice:      Number(i.unitPrice      ?? i.unit_price      ?? 0),
    reason:         i.reason    ?? "CustomerRequest",
    condition:      i.condition ?? "Good",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReturn(r: any): SaleReturn {
  return {
    id:            r.id,
    returnNumber:  r.returnNumber  ?? r.return_number  ?? "",
    saleId:        r.saleId        ?? r.sale_id        ?? "",
    invoiceNumber: r.invoiceNumber ?? r.invoice_number ?? "",
    returnDate:    r.returnDate    ?? r.return_date    ?? "",
    items:         (r.items ?? []).map(mapReturnItem),
    reason:        r.reason        ?? "",
    notes:         r.notes,
    refundAmount:  Number(r.refundAmount ?? r.refund_amount ?? 0),
    refundMethod:  (r.refundMethod ?? r.refund_method ?? "Cash") as PaymentMethod,
    status:        r.status        ?? "Approved",
    createdAt:     r.createdAt     ?? r.created_at     ?? "",
  };
}

export interface ReturnListResult {
  returns:    SaleReturn[];
  total:      number;
  page:       number;
  totalPages: number;
}

export interface ReturnStats {
  total:       number;
  today:       number;
  totalAmount: number;
}

export const returnService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<ReturnListResult> {
    const data = await apiGet<{ items: unknown[]; total: number; page: number; totalPages: number }>(
      "/returns",
      { search: params?.search, page: params?.page, limit: params?.limit }
    );
    return {
      returns:    (data.items ?? []).map(mapReturn),
      total:      data.total      ?? 0,
      page:       data.page       ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },

  async getStats(): Promise<ReturnStats> {
    return apiGet<ReturnStats>("/returns/stats");
  },

  async create(data: {
    saleId:       string;
    items:        ReturnItem[];
    refundMethod: PaymentMethod;
    notes?:       string;
  }): Promise<SaleReturn> {
    const raw = await apiPost<unknown>("/returns", data);
    return mapReturn(raw);
  },
};
