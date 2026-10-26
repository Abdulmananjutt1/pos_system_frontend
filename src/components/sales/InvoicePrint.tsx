"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Sale } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface InvoicePrintProps {
  sale: Sale;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  onClose: () => void;
}

export default function InvoicePrint({
  sale,
  pharmacyName = "PharmaPOS",
  pharmacyAddress = "Pharmacy Management System",
  pharmacyPhone = "021-XXXXXXX",
  onClose,
}: InvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${sale.invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 16px;
              color: #111;
              width: 80mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #999; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row { font-size: 14px; font-weight: bold; }
            .header { margin-bottom: 10px; }
            .items { margin: 8px 0; }
            .item-name { margin-bottom: 2px; }
            .footer { margin-top: 10px; text-align: center; font-size: 11px; color: #555; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invoice content (printable) */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div
            ref={printRef}
            className="font-mono text-xs text-gray-800 space-y-1"
          >
            {/* Header */}
            <div className="text-center mb-3">
              <p className="text-base font-bold tracking-wide">{pharmacyName}</p>
              <p className="text-gray-500">{pharmacyAddress}</p>
              <p className="text-gray-500">Tel: {pharmacyPhone}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Invoice info */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice:</span>
                <span className="font-semibold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{formatDate(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span>
                  {new Date(sale.createdAt).toLocaleTimeString("en-PK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">
                  {sale.customerName || "Walk-in"}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Column headers */}
            <div className="flex justify-between font-semibold text-gray-600 text-[10px] uppercase">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Price</span>
              <span className="w-16 text-right">Total</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-1" />

            {/* Items */}
            {sale.items.map((item, i) => (
              <div key={i} className="space-y-0">
                <div className="flex justify-between items-start">
                  <span className="flex-1 leading-tight pr-2 text-[11px]">
                    {item.medicineName}
                  </span>
                  <span className="w-8 text-center text-[11px]">
                    {item.quantity}
                  </span>
                  <span className="w-16 text-right text-[11px]">
                    {formatCurrency(item.unitPrice)}
                  </span>
                  <span className="w-16 text-right font-medium text-[11px]">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Totals */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(sale.tax)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            <div className="flex justify-between text-base font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>

            <div className="flex justify-between mt-1">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold">{sale.paymentMethod}</span>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            {/* Footer */}
            <div className="text-center text-gray-400 text-[10px] space-y-0.5">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt for returns within 7 days.</p>
              <p className="mt-1 font-mono">{sale.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer size={16} />
            Print Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
