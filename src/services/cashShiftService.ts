import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";

export interface ShiftEntry {
  id:          string;
  description: string;
  amount:      number;
  type:        "in" | "out";
  createdAt:   string;
}

export interface CashShift {
  id:             string;
  shiftNumber:    string;
  openedBy:       string;
  closedBy?:      string;
  openTime:       string;
  closeTime?:     string;
  openingBalance: number;
  closingBalance?: number;
  expectedCash?:   number;
  variance?:       number;
  status:         "Open" | "Closed";
  notes?:         string;
  entries:        ShiftEntry[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShift(s: any): CashShift {
  return {
    id:             s.id,
    shiftNumber:    s.shiftNumber    ?? s.shift_number    ?? "",
    openedBy:       s.openedBy       ?? s.opened_by       ?? "",
    closedBy:       s.closedBy       ?? s.closed_by,
    openTime:       s.openTime       ?? s.open_time       ?? "",
    closeTime:      s.closeTime      ?? s.close_time,
    openingBalance: Number(s.openingBalance ?? s.opening_balance ?? 0),
    closingBalance: s.closingBalance != null ? Number(s.closingBalance ?? s.closing_balance) : undefined,
    expectedCash:   s.expectedCash   != null ? Number(s.expectedCash  ?? s.expected_cash)   : undefined,
    variance:       s.variance       != null ? Number(s.variance)      : undefined,
    status:         s.status         ?? "Open",
    notes:          s.notes,
    entries:        (s.entries ?? []).map((e: any) => ({
      id:          e.id,
      description: e.description,
      amount:      Number(e.amount),
      type:        e.type as "in" | "out",
      createdAt:   e.createdAt ?? e.created_at ?? "",
    })),
  };
}

export const cashShiftService = {
  async getCurrent(): Promise<CashShift | null> {
    const data = await apiGet<unknown>("/cash-shifts/current");
    return data ? mapShift(data) : null;
  },

  async open(openingBalance: number): Promise<CashShift> {
    const raw = await apiPost<unknown>("/cash-shifts/open", { openingBalance });
    return mapShift(raw);
  },

  async close(id: string, closingBalance: number, notes?: string): Promise<CashShift> {
    const raw = await apiPatch<unknown>(`/cash-shifts/${id}/close`, { closingBalance, notes });
    return mapShift(raw);
  },

  async addEntry(id: string, description: string, amount: number, type: "in" | "out"): Promise<ShiftEntry> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await apiPost<any>(`/cash-shifts/${id}/entries`, { description, amount, type });
    return { id: raw.id, description: raw.description, amount: Number(raw.amount), type: raw.type, createdAt: raw.createdAt ?? "" };
  },
};
