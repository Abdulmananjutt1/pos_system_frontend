import { Customer } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCustomer(c: any): Customer {
  return {
    id:             c.id,
    name:           c.name,
    phone:          c.phone          ?? "",
    email:          c.email,
    address:        c.address,
    totalPurchases: Number(c.totalPurchases ?? c.total_purchases ?? 0),
    createdAt:      c.createdAt      ?? c.created_at ?? "",
  };
}

export interface CustomerListResult {
  customers:  Customer[];
  total:      number;
  page:       number;
  totalPages: number;
}

export const customerService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<CustomerListResult> {
    const data = await apiGet<{ items: unknown[]; total: number; page: number; totalPages: number }>(
      "/customers",
      { search: params?.search, page: params?.page, limit: params?.limit }
    );
    return {
      customers:  (data.items ?? []).map(mapCustomer),
      total:      data.total      ?? 0,
      page:       data.page       ?? 1,
      totalPages: data.totalPages ?? 1,
    };
  },

  async create(data: { name: string; phone: string; email?: string; address?: string }): Promise<Customer> {
    const raw = await apiPost<unknown>("/customers", data);
    return mapCustomer(raw);
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const raw = await apiPut<unknown>(`/customers/${id}`, data);
    return mapCustomer(raw);
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/customers/${id}`);
  },
};
