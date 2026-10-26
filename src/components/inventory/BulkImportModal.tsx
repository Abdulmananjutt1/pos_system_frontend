"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle, Download, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Medicine, MedicineCategory } from "@/types";
import { MEDICINE_CATEGORIES } from "@/lib/constants";

type ImportRow = Omit<Medicine, "id" | "createdAt" | "updatedAt"> & {
  _rowNum: number;
  _errors: string[];
};

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (medicines: Omit<Medicine, "id" | "createdAt" | "updatedAt">[]) => void;
}

const TEMPLATE_HEADERS = [
  "name", "genericName", "brand", "category", "unit", "batchNumber",
  "expiryDate", "purchasePrice", "sellingPrice", "stock", "minStock",
  "requiresPrescription",
];

export default function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    });
  };

  const validateRow = (raw: Record<string, string>, rowNum: number): ImportRow => {
    const errors: string[] = [];
    if (!raw.name?.trim()) errors.push("name required");
    if (!raw.genericName?.trim()) errors.push("genericName required");
    if (!raw.brand?.trim()) errors.push("brand required");
    if (!MEDICINE_CATEGORIES.includes(raw.category as MedicineCategory)) errors.push(`category must be one of: ${MEDICINE_CATEGORIES.join(", ")}`);
    if (!raw.batchNumber?.trim()) errors.push("batchNumber required");
    if (!raw.expiryDate?.trim()) errors.push("expiryDate required");
    const pp = Number(raw.purchasePrice);
    const sp = Number(raw.sellingPrice);
    if (isNaN(pp) || pp <= 0) errors.push("purchasePrice must be >0");
    if (isNaN(sp) || sp <= 0) errors.push("sellingPrice must be >0");
    const stock = Number(raw.stock);
    const minStock = Number(raw.minStock);
    if (isNaN(stock) || stock < 0) errors.push("stock must be >=0");

    return {
      _rowNum: rowNum,
      _errors: errors,
      name: raw.name?.trim() ?? "",
      genericName: raw.genericName?.trim() ?? "",
      brand: raw.brand?.trim() ?? "",
      category: (MEDICINE_CATEGORIES.includes(raw.category as MedicineCategory) ? raw.category : "Other") as MedicineCategory,
      unit: raw.unit?.trim() || "Strip",
      batchNumber: raw.batchNumber?.trim() ?? "",
      expiryDate: raw.expiryDate?.trim() ?? "",
      purchasePrice: pp || 0,
      sellingPrice: sp || 0,
      stock: isNaN(stock) ? 0 : stock,
      minStock: isNaN(minStock) ? 10 : minStock,
      requiresPrescription: raw.requiresPrescription?.toLowerCase() === "true",
      supplierId: raw.supplierId?.trim() ?? "",
    };
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rawRows = parseCSV(text);
      const validated = rawRows.map((row, i) => validateRow(row, i + 2));
      setRows(validated);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => r._errors.length === 0);
  const errorRows = rows.filter((r) => r._errors.length > 0);

  const handleImport = () => {
    const meds = validRows.map(({ _rowNum, _errors, ...rest }) => rest);
    onImport(meds);
    setImportedCount(meds.length);
    setStep("done");
  };

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(",") + "\n" +
      "Panadol Extra,Paracetamol 500mg,GSK,Tablet,Strip,BN2024001,2026-06-30,18,25,500,50,false\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medicines_import_template.csv";
    a.click();
  };

  const reset = () => { setRows([]); setStep("upload"); setImportedCount(0); };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Bulk Import Medicines" size="xl">
      {step === "upload" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Upload a CSV file with medicine data. Download the template to get started.</p>
            <Button size="sm" variant="outline" onClick={downloadTemplate}><Download size={13} />Template</Button>
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          >
            <Upload size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">Drag & drop your CSV file here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required columns</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_HEADERS.map((h) => (
                <span key={h} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600">{h}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-green-600" /><span className="font-semibold text-green-700">{validRows.length} valid rows</span></div>
            {errorRows.length > 0 && <div className="flex items-center gap-2 text-sm"><XCircle size={16} className="text-red-500" /><span className="font-semibold text-red-600">{errorRows.length} errors (will be skipped)</span></div>}
          </div>
          {errorRows.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 mb-2">Errors:</p>
              {errorRows.map((r) => (
                <p key={r._rowNum} className="text-xs text-red-600">Row {r._rowNum}: {r._errors.join(", ")}</p>
              ))}
            </div>
          )}
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Name", "Generic", "Brand", "Category", "Batch", "Expiry", "Purchase", "Selling", "Stock", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 50).map((row) => (
                  <tr key={row._rowNum} className={row._errors.length > 0 ? "bg-red-50" : ""}>
                    <td className="px-3 py-1.5 text-gray-400">{row._rowNum}</td>
                    <td className="px-3 py-1.5 font-medium whitespace-nowrap">{row.name || "—"}</td>
                    <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{row.genericName || "—"}</td>
                    <td className="px-3 py-1.5 text-gray-500">{row.brand || "—"}</td>
                    <td className="px-3 py-1.5">{row.category}</td>
                    <td className="px-3 py-1.5 font-mono">{row.batchNumber || "—"}</td>
                    <td className="px-3 py-1.5">{row.expiryDate || "—"}</td>
                    <td className="px-3 py-1.5">{row.purchasePrice}</td>
                    <td className="px-3 py-1.5">{row.sellingPrice}</td>
                    <td className="px-3 py-1.5">{row.stock}</td>
                    <td className="px-3 py-1.5">
                      {row._errors.length === 0
                        ? <Badge variant="success">OK</Badge>
                        : <Badge variant="danger">Error</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={reset}>Back</Button>
            <Button className="flex-1" onClick={handleImport} disabled={validRows.length === 0}>
              <Upload size={15} />Import {validRows.length} Medicine{validRows.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">Import Complete!</p>
            <p className="text-sm text-gray-500 mt-1">{importedCount} medicine{importedCount !== 1 ? "s" : ""} added to catalogue</p>
          </div>
          <Button onClick={() => { reset(); onClose(); }}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
