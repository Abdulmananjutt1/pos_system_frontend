"use client";

import { useRef, useState } from "react";
import { Scan } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Manual barcode entry field (for devices without a physical scanner).
 * Also acts as target for physical scanner Enter-terminated input.
 */
export default function BarcodeInput({
  onScan,
  placeholder = "Scan barcode or enter medicine ID…",
  className,
}: BarcodeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onScan(value.trim());
      setValue("");
    }
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Scan
        size={16}
        className="absolute left-3 text-indigo-500 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full pl-9 pr-4 py-2.5 text-sm",
          "bg-indigo-50 border border-indigo-200 rounded-xl",
          "placeholder:text-indigo-300",
          "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white",
          "transition-colors"
        )}
        aria-label="Barcode scanner input"
      />
    </div>
  );
}
