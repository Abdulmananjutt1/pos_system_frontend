"use client";

import { Bell, Search, Palette, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePharmacyStore } from "@/store";
import { isExpiringSoon, isExpired } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { ThemeColor } from "@/types";
import { THEMES } from "@/lib/themes";
import toast from "react-hot-toast";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const medicines      = usePharmacyStore((s) => s.medicines);
  const themeColor     = usePharmacyStore((s) => s.settings.themeColor);
  const updateSettings = usePharmacyStore((s) => s.updateSettings);

  const [now, setNow]           = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setNow(new Date()); }, []);

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const alerts = now
    ? medicines.filter(
        (m) =>
          m.stock <= LOW_STOCK_THRESHOLD ||
          isExpiringSoon(m.expiryDate, 30, now) ||
          isExpired(m.expiryDate, now)
      ).length
    : 0;

  const handleThemeChange = (key: ThemeColor) => {
    updateSettings({ themeColor: key });
    setShowPicker(false);
    const label = THEMES.find((t) => t.key === key)?.label ?? key;
    toast.success(`Theme: ${label}`);
  };

  // Active swatch color for the icon indicator dot
  const activeSwatch = THEMES.find((t) => t.key === themeColor)?.swatch ?? "#2563eb";

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">

        {/* ── Search ── */}
        <div className="relative hidden md:flex items-center">
          <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 w-52"
            style={{ "--tw-ring-color": "var(--theme-500)" } as React.CSSProperties}
          />
        </div>

        {/* ── Theme Picker ── */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Change theme colour"
            title="Change theme colour"
          >
            <Palette size={20} />
            {/* Small dot showing active theme colour */}
            <span
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ backgroundColor: activeSwatch }}
            />
          </button>

          {/* Popover */}
          {showPicker && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-30">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 px-1">
                Theme Colour
              </p>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ key, label, swatch }) => {
                  const isActive = themeColor === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      title={label}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border-2 ${
                        isActive
                          ? "border-gray-300 bg-gray-50"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: swatch }}
                      >
                        {isActive && (
                          <Check size={14} className="text-white" strokeWidth={3} />
                        )}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 leading-tight text-center">
                        {label.split(" ")[1] /* e.g. "Blue", "Purple" */}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {alerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {alerts > 9 ? "9+" : alerts}
            </span>
          )}
        </button>

        {/* ── Date ── */}
        <div className="hidden lg:block text-sm text-gray-500">
          {now?.toLocaleDateString("en-PK", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </header>
  );
}
