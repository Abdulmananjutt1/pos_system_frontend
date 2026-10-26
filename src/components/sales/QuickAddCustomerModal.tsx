"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Customer } from "@/types";

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: Omit<Customer, "id" | "createdAt" | "totalPurchases">) => void;
}

const defaultForm = { name: "", phone: "", email: "", address: "" };

export default function QuickAddCustomerModal({
  isOpen,
  onClose,
  onAdd,
}: QuickAddCustomerModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({});

  const set = (field: keyof typeof form, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Partial<typeof defaultForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onAdd({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
    });
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="cust-name"
          label="Full Name *"
          placeholder="e.g. Ahmed Khan"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
        />
        <Input
          id="cust-phone"
          label="Phone *"
          placeholder="e.g. 0300-1234567"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
        />
        <Input
          id="cust-email"
          label="Email"
          type="email"
          placeholder="optional"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          id="cust-address"
          label="Address"
          placeholder="optional"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" type="submit">
            Add Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
