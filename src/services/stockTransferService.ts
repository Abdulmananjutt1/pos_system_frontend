import { StockTransfer, StockTransferItem, TransferStatus, TransferType } from "@/types";
import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(i: any): StockTransferItem & { id: string } {
  return {
    id:           i.id,
    medicineId:   i.medicineId   ?? i.medicine_id   ?? "",
    medicineName: i.medicineName ?? i.medicine_name ?? "",
    quantity:     Number(i.quantity ?? 1),
    batchNumber:  i.batchNumber  ?? i.batch_number,
    expiryDate:   i.expiryDate   ?? i.expiry_date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTransfer(t: any): StockTransfer {
  return {
    id:               t.id,
    transferNumber:   t.transferNumber   ?? t.transfer_number   ?? "",
    transferType:     (t.transferType    ?? t.transfer_type     ?? "Internal") as TransferType,
    fromBranch:       t.fromBranch       ?? t.from_branch       ?? "",
    toBranch:         t.toBranch         ?? t.to_branch         ?? "",
    externalPharmacy: t.externalPharmacy ?? t.external_pharmacy,
    externalPhone:    t.externalPhone    ?? t.external_phone,
    transferDate:     t.transferDate     ?? t.transfer_date     ?? "",
    receiveDate:      t.receiveDate      ?? t.receive_date,
    status:           t.status           as TransferStatus,
    notes:            t.notes,
    initiatedBy:      t.initiatedBy      ?? t.initiated_by      ?? "",
    items:            (t.items ?? []).map(mapItem),
    createdAt:        t.createdAt        ?? t.created_at        ?? "",
  };
}

export interface TransferListResult {
  transfers:  StockTransfer[];
  total:      number;
  page:       number;
  totalPages: number;
}

export const stockTransferService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<TransferListResult> {
    const data = await apiGet<{ items: unknown[]; total: number; page: number; totalPages: number }>(
      "/transfers",
      { search: params?.search, page: params?.page, limit: params?.limit }
    );
    return {
      transfers:  (data.items ?? []).map(mapTransfer),
      total:      data.total      ?? 0,
      page:       data.page       ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },

  async create(data: {
    transferType:     TransferType;
    fromBranch:       string;
    toBranch:         string;
    externalPharmacy?: string;
    externalPhone?:   string;
    notes?:           string;
    initiatedBy:      string;
    items: { medicineId?: string; medicineName: string; quantity: number }[];
  }): Promise<StockTransfer> {
    const raw = await apiPost<unknown>("/transfers", {
      ...data,
      transferDate: new Date().toISOString().split("T")[0],
    });
    return mapTransfer(raw);
  },

  async updateStatus(id: string, status: TransferStatus): Promise<StockTransfer> {
    const raw = await apiPatch<unknown>(`/transfers/${id}/status`, { status });
    return mapTransfer(raw);
  },

  async receive(id: string): Promise<StockTransfer> {
    const raw = await apiPost<unknown>(`/transfers/${id}/receive`, {});
    return mapTransfer(raw);
  },
};
