"use client";

import { Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Medicine } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MedicineGridProps {
  medicines: Medicine[];
  search: string;
  onSearchChange: (val: string) => void;
  onSelect: (medicine: Medicine) => void;
}

export default function MedicineGrid({
  medicines,
  search,
  onSearchChange,
  onSelect,
}: MedicineGridProps) {
  const filtered = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search medicines by name, generic, brand…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1 pb-2">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-300">
            <Search size={36} />
            <p className="mt-2 text-sm">No medicines found</p>
          </div>
        ) : (
          filtered.map((med) => (
            <MedicineCard key={med.id} medicine={med} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}

interface MedicineCardProps {
  medicine: Medicine;
  onSelect: (medicine: Medicine) => void;
}

function MedicineCard({ medicine: med, onSelect }: MedicineCardProps) {
  const isOut = med.stock === 0;
  const isLow = !isOut && med.stock <= 10;

  return (
    <button
      onClick={() => onSelect(med)}
      disabled={isOut}
      className={cn(
        "bg-white border rounded-xl p-3 text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-400",
        isOut
          ? "opacity-50 cursor-not-allowed border-gray-200"
          : "hover:border-blue-400 hover:shadow-md cursor-pointer border-gray-200"
      )}
      aria-label={`Add ${med.name} to cart`}
    >
      <div className="flex items-start justify-between mb-2 gap-1">
        <Badge variant={isOut ? "danger" : isLow ? "warning" : "success"}>
          {isOut ? "Out of stock" : `${med.stock} left`}
        </Badge>
        {med.requiresPrescription && (
          <span className="shrink-0 text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
            Rx
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
        {med.name}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{med.brand}</p>
      <p className="text-xs text-gray-400 truncate">{med.category}</p>
      <p className="text-sm font-bold text-blue-600 mt-2">
        {formatCurrency(med.sellingPrice)}
        <span className="text-xs font-normal text-gray-400 ml-1">/ {med.unit}</span>
      </p>
    </button>
  );
}
