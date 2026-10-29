import { Supplier } from "@/types";
import { apiGet } from "@/lib/apiClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupplier(s: any): Supplier {
  return {
    id:            s.id,
    name:          s.name,
    contactPerson: s.contactPerson ?? s.contact_person ?? "",
    phone:         s.phone         ?? "",
    email:         s.email,
    address:       s.address       ?? "",
    createdAt:     s.createdAt     ?? s.created_at ?? new Date().toISOString(),
  };
}

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const data = await apiGet<{ items: unknown[] }>("/suppliers", { limit: 200 });
    return (data.items ?? []).map(mapSupplier);
  },
};
