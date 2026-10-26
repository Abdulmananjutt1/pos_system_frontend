"use client";

import { useState } from "react";
import { Delete, X, Key } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { usePharmacyStore } from "@/store";
import toast from "react-hot-toast";

interface PINPadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PINPadModal({ isOpen, onClose }: PINPadModalProps) {
  const loginWithPin = usePharmacyStore((s) => s.loginWithPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => {
        const user = loginWithPin(next);
        if (user) {
          toast.success(`Switched to ${user.name} (${user.role})`);
          setPin("");
          onClose();
        } else {
          setError("Invalid PIN");
          setPin("");
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <Modal isOpen={isOpen} onClose={() => { setPin(""); setError(""); onClose(); }} title="Quick Cashier Switch" size="sm">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Key size={18} className="text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 text-center">Enter your 4-digit PIN to switch user</p>
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors ${pin.length > i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-transparent"}`}>
              {pin.length > i ? "●" : "○"}
            </div>
          ))}
        </div>

        {error && <p className="text-center text-sm text-red-500 font-medium">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {digits.slice(0, 9).map((d) => (
            <button key={d} onClick={() => handleDigit(d)}
              className="h-12 rounded-xl border border-gray-200 bg-white text-lg font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors active:scale-95">
              {d}
            </button>
          ))}
          <button onClick={() => { setPin(""); setError(""); }}
            className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center">
            <X size={16} />
          </button>
          <button onClick={() => handleDigit("0")}
            className="h-12 rounded-xl border border-gray-200 bg-white text-lg font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors active:scale-95">
            0
          </button>
          <button onClick={handleDelete}
            className="h-12 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center">
            <Delete size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
