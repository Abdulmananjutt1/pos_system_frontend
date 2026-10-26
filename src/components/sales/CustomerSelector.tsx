"use client";

import { useState, useRef, useEffect } from "react";
import { User, X, UserPlus } from "lucide-react";
import { Customer } from "@/types";
import { cn } from "@/lib/utils";

interface CustomerSelectorProps {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
  onAddNew?: () => void;
}

export default function CustomerSelector({
  customers,
  selected,
  onSelect,
  onAddNew,
}: CustomerSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      )
    : customers.slice(0, 6);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <User size={14} className="text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-800 truncate">
              {selected.name}
            </p>
            <p className="text-xs text-blue-500">{selected.phone}</p>
          </div>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="ml-2 p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
          aria-label="Remove customer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Walk-in or search customer…"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
      />

      {open && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">
              No customers found
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm",
                  "hover:bg-blue-50 transition-colors flex items-center gap-2"
                )}
              >
                <User size={13} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </div>
              </button>
            ))
          )}
          {onAddNew && (
            <button
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center gap-2 font-medium"
            >
              <UserPlus size={13} />
              Add new customer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
