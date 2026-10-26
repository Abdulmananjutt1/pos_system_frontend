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

  const [now, setNow]               = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => { setNow(new Date()); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
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

  const activeTheme  = THEMES.find((t) => t.key === themeColor);
  const activeSwatch = activeTheme?.swatch ?? "#4f46e5";
  const isLightSwatch = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>

      <div className="flex items-center gap-2">

        {/* ── Search ── */}
        <div className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Quick search…"
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 transition-all focus:w-56"
          />
        </div>

        {/* ── Theme Picker ── */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Change theme"
            title="Change theme"
          >
            <Palette size={18} />
            <span
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: activeSwatch }}
            />
          </button>

          {showPicker && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
                Choose Theme
              </p>
              <div className="grid grid-cols-5 gap-2">
                {THEMES.map(({ key, label, swatch, previewBg }) => {
                  const isActive    = themeColor === key;
                  const bg          = previewBg ?? swatch;
                  const lightSwatch = isLightSwatch(bg);
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      title={label}
                      className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                        isActive ? "ring-2 ring-offset-1 ring-gray-400" : "hover:scale-105"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform ${
                          lightSwatch ? "border border-gray-200" : ""
                        }`}
                        style={{ background: bg }}
                      >
                        {isActive && (
                          <Check
                            size={15}
                            strokeWidth={3}
                            className={lightSwatch ? "text-gray-700" : "text-white"}
                          />
                        )}
                      </span>
                      <span className="text-[9px] font-semibold text-gray-500 leading-tight text-center truncate w-full">
                        {label.split(" ").pop()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active theme label */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                  style={{ background: activeSwatch }}
                />
                <span className="text-xs font-semibold text-gray-700">{activeTheme?.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {alerts > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {alerts > 9 ? "9+" : alerts}
            </span>
          )}
        </button>

        {/* ── Date ── */}
        <div className="hidden lg:block text-xs font-medium text-gray-400 ml-1">
          {now?.toLocaleDateString("en-PK", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>
    </header>
  );
}
