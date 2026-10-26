"use client";

import { useState, useRef } from "react";
import { FileImage, X, Upload, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export interface PrescriptionData {
  doctorName: string;
  patientName: string;
  prescriptionNote: string;
  imageUrl?: string;
  fileName?: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PrescriptionData) => void;
  initial?: PrescriptionData | null;
  hasRxItems: boolean;
}

export default function PrescriptionModal({
  isOpen, onClose, onSave, initial, hasRxItems,
}: PrescriptionModalProps) {
  const [form, setForm] = useState<PrescriptionData>({
    doctorName: initial?.doctorName ?? "",
    patientName: initial?.patientName ?? "",
    prescriptionNote: initial?.prescriptionNote ?? "",
    imageUrl: initial?.imageUrl,
    fileName: initial?.fileName,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a data URL for preview (in production upload to cloud storage)
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        imageUrl: ev.target?.result as string,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        imageUrl: ev.target?.result as string,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prescription Details" size="md">
      <div className="space-y-4">
        {hasRxItems && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            ⚠️ Cart contains Rx or controlled items. Doctor details and prescription are required.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Doctor Name" value={form.doctorName}
            onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
            placeholder="Dr. Ahmed" />
          <Input label="Patient Name" value={form.patientName}
            onChange={(e) => setForm({ ...form, patientName: e.target.value })}
            placeholder="Patient name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Prescription Note</label>
          <textarea value={form.prescriptionNote}
            onChange={(e) => setForm({ ...form, prescriptionNote: e.target.value })}
            rows={2} placeholder="Optional notes about the prescription…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Prescription Image (optional)</label>
          {form.imageUrl ? (
            <div className="relative border border-gray-200 rounded-xl overflow-hidden">
              {form.imageUrl.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="Prescription" className="w-full max-h-40 object-contain bg-gray-50" />
              ) : (
                <div className="p-4 bg-gray-50 flex items-center gap-3">
                  <FileImage size={20} className="text-blue-500" />
                  <span className="text-sm text-gray-700">{form.fileName}</span>
                </div>
              )}
              <button onClick={() => setForm({ ...form, imageUrl: undefined, fileName: undefined })}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-gray-500 hover:text-red-500">
                <X size={14} />
              </button>
              <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs text-green-700 font-medium">{form.fileName ?? "Image uploaded"}</span>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF accepted</p>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave}><CheckCircle size={15} />Save Details</Button>
        </div>
      </div>
    </Modal>
  );
}
