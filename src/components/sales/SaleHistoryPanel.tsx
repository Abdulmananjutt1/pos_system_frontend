"use client";

import { useState } from "react";
import { Search, Eye, Printer, ReceiptText } from "lucide-react";
import { Sale } from "@/types";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SaleHistoryPanelProps {
  sales: Sale[];
  onViewInvoice: (sale: Sale) => void;
}

export default function SaleHistoryPanel({
  sales,
  onViewInvoice,
}: SaleHistoryPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice or customer…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <ReceiptText size={40} />
            <p className="mt-2 text-sm">No sales found</p>
          </div>
        ) : (
          filtered.map((sale) => (
            <SaleHistoryRow
              key={sale.id}
              sale={sale}
              onView={onViewInvoice}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SaleHistoryRowProps {
  sale: Sale;
  onView: (sale: Sale) => void;
}

function SaleHistoryRow({ sale, onView }: SaleHistoryRowProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {sale.invoiceNumber}
            </p>
            <Badge
              variant={
                sale.status === "Completed"
                  ? "success"
                  : sale.status === "Refunded"
                  ? "danger"
                  : "warning"
              }
            >
              {sale.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {sale.customerName || "Walk-in"} •{" "}
            {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(sale.createdAt)} •{" "}
            {new Date(sale.createdAt).toLocaleTimeString("en-PK", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {sale.paymentMethod}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(sale.total)}
          </p>
          {sale.discount > 0 && (
            <p className="text-xs text-green-600">
              -{formatCurrency(sale.discount)} off
            </p>
          )}
          <button
            onClick={() => onView(sale)}
            className={cn(
              "mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800",
              "transition-colors font-medium"
            )}
            aria-label={`View invoice ${sale.invoiceNumber}`}
          >
            <Eye size={12} />
            View / Print
          </button>
        </div>
      </div>
    </div>
  );
}
