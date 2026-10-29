import { PurchaseOrder, PurchaseOrderItem, POStatus } from "@/types";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(i: any): PurchaseOrderItem {
  return {
    medicineId:       i.medicineId      ?? i.medicine_id      ?? "",
    medicineName:     i.medicineName    ?? i.medicine_name    ?? "",
    quantity:         Number(i.quantity ?? 1),
    unitPrice:        Number(i.unitPrice ?? i.unit_price      ?? 0),
    receivedQuantity: Number(i.receivedQuantity ?? i.received_quantity ?? 0),
    total:            Number(i.total    ?? 0),
    batchNumber:      i.batchNumber     ?? i.batch_number,
    expiryDate:       i.expiryDate      ?? i.expiry_date,
    // keep item id for receive endpoint
    id:               i.id,
  } as PurchaseOrderItem & { id: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPO(po: any): PurchaseOrder {
  return {
    id:                   po.id,
    poNumber:             po.poNumber             ?? po.po_number             ?? "",
    supplierId:           po.supplierId           ?? po.supplier_id           ?? "",
    supplierName:         po.supplierName         ?? po.supplier_name         ?? "",
    items:                (po.items ?? []).map(mapItem),
    poDate:               po.poDate               ?? po.po_date               ?? "",
    expectedDeliveryDate: po.expectedDeliveryDate ?? po.expected_delivery_date,
    status:               po.status               as POStatus,
    totalAmount:          Number(po.totalAmount   ?? po.total_amount          ?? 0),
    notes:                po.notes,
    createdAt:            po.createdAt            ?? po.created_at            ?? "",
    updatedAt:            po.updatedAt            ?? po.updated_at            ?? "",
  };
}

export interface POListResult {
  orders: PurchaseOrder[];
  total: number;
  page: number;
  totalPages: number;
}

export const purchaseOrderService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<POListResult> {
    const data = await apiGet<{ items: unknown[]; total: number; page: number; totalPages: number }>(
      "/purchase-orders",
      { search: params?.search, page: params?.page, limit: params?.limit }
    );
    return {
      orders:     (data.items ?? []).map(mapPO),
      total:      data.total      ?? 0,
      page:       data.page       ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },

  async create(data: {
    supplierId?:           string;
    supplierName:          string;
    poDate?:               string;
    expectedDeliveryDate?: string;
    notes?:                string;
    items: Omit<PurchaseOrderItem, "receivedQuantity" | "total">[];
  }): Promise<PurchaseOrder> {
    const items = data.items.map((i) => ({
      ...i,
      total: i.quantity * i.unitPrice,
      receivedQuantity: 0,
    }));
    const raw = await apiPost<unknown>("/purchase-orders", { ...data, items });
    return mapPO(raw);
  },

  async updateStatus(id: string, status: POStatus): Promise<PurchaseOrder> {
    const raw = await apiPatch<unknown>(`/purchase-orders/${id}/status`, { status });
    return mapPO(raw);
  },

  async receiveGoods(
    id: string,
    items: { id: string; receivedQuantity: number; batchNumber?: string; expiryDate?: string }[]
  ): Promise<PurchaseOrder> {
    const raw = await apiPost<unknown>(`/purchase-orders/${id}/receive`, { items });
    return mapPO(raw);
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/purchase-orders/${id}`);
  },
};
