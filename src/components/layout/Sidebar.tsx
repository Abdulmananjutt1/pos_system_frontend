"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, Pill, Users, Truck,
  BarChart2, Settings, Cross, ClipboardList, ClipboardCheck,
  ArrowLeftRight, RotateCcw, Clock, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePharmacyStore } from "@/store";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { THEMES } from "@/lib/themes";

// ── Per-theme sidebar config (inline styles — no CSS variable dependency) ──
const SIDEBAR_CONFIG: Record<string, {
  bg: string;
  border: string;
  text: string;
  hoverBg: string;
  activeBg: string;
  activeText: string;
  muted: string;
  logoText: string;
  isLight: boolean;
}> = {
  blue:   { bg: "#0f1f3d", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(37,99,235,0.25)",    activeBg: "#2563eb",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  indigo: { bg: "#1e1b4b", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(99,102,241,0.22)",   activeBg: "#4f46e5",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  purple: { bg: "#1a0533", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(147,51,234,0.22)",   activeBg: "#7c3aed",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  green:  { bg: "#022c22", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(5,150,105,0.22)",    activeBg: "#059669",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  teal:   { bg: "#03202b", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(8,145,178,0.22)",    activeBg: "#0891b2",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  cyan:   { bg: "#03243b", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(14,165,233,0.22)",   activeBg: "#0ea5e9",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  orange: { bg: "#1c0a00", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(217,119,6,0.22)",    activeBg: "#d97706",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  rose:   { bg: "#3b0016", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.55)", hoverBg: "rgba(225,29,72,0.22)",    activeBg: "#e11d48",  activeText: "#fff",     muted: "rgba(255,255,255,0.35)", logoText: "#fff", isLight: false },
  black:  { bg: "#09090b", border: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.45)", hoverBg: "rgba(255,255,255,0.06)",  activeBg: "#27272a",  activeText: "#fff",     muted: "rgba(255,255,255,0.28)", logoText: "#fff", isLight: false },
  // ── White theme — fully light sidebar ──
  white:  { bg: "#ffffff", border: "#e2e8f0",                 text: "#64748b",                hoverBg: "#eff6ff",                 activeBg: "#eff6ff",  activeText: "#1d4ed8",  muted: "#94a3b8",               logoText: "#1e293b", isLight: true  },
};

const navItems = [
  { label: "Dashboard",       href: "/",                icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW        },
  { label: "Point of Sale",   href: "/sales",           icon: ShoppingCart,    permission: PERMISSIONS.SALES_CREATE          },
  { label: "Inventory",       href: "/inventory",       icon: Package,         permission: PERMISSIONS.INVENTORY_VIEW        },
  { label: "Medicines",       href: "/medicines",       icon: Pill,            permission: PERMISSIONS.MEDICINES_READ        },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList,   permission: PERMISSIONS.PURCHASE_ORDERS_READ  },
  { label: "Customers",       href: "/customers",       icon: Users,           permission: PERMISSIONS.CUSTOMERS_READ        },
  { label: "Suppliers",       href: "/suppliers",       icon: Truck,           permission: PERMISSIONS.SUPPLIERS_READ        },
  { label: "Stock Count",     href: "/stock-count",     icon: ClipboardCheck,  permission: PERMISSIONS.STOCK_COUNT_VIEW      },
  { label: "Transfers",       href: "/transfers",       icon: ArrowLeftRight,  permission: PERMISSIONS.TRANSFERS_READ        },
  { label: "Returns",         href: "/returns",         icon: RotateCcw,       permission: PERMISSIONS.RETURNS_READ          },
  { label: "Reports",         href: "/reports",         icon: BarChart2,       permission: PERMISSIONS.REPORTS_VIEW          },
  { label: "Login History",   href: "/login-history",   icon: Clock,           permission: PERMISSIONS.LOGIN_HISTORY_VIEW    },
  { label: "Settings",        href: "/settings",        icon: Settings,        permission: PERMISSIONS.SETTINGS_VIEW         },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const { currentUser, logout, settings } = usePharmacyStore();

  const { can, isAdmin } = usePermissions();
  const cfg = SIDEBAR_CONFIG[settings.themeColor] ?? SIDEBAR_CONFIG.indigo;
  const activeSwatch = THEMES.find(t => t.key === settings.themeColor)?.swatch ?? "#4f46e5";

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
  };

  const visibleNav = navItems.filter((item) => can(item.permission));

  return (
    <aside
      style={{
        backgroundColor: cfg.bg,
        borderRight: `1px solid ${cfg.border}`,
        transition: "background-color 0.25s ease, border-color 0.25s ease",
      }}
      className="w-60 h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden"
    >
      {/* ── Logo ── */}
      <div
        style={{ borderBottom: `1px solid ${cfg.border}` }}
        className="px-5 py-5"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: cfg.isLight ? "#334155" : activeSwatch }}
          >
            <Cross size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold leading-tight text-base" style={{ color: cfg.logoText }}>
              PharmaPOS
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: cfg.muted }}>
              {currentUser?.branch ?? "Pharmacy System"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              style={
                isActive
                  ? { backgroundColor: cfg.activeBg, color: cfg.activeText }
                  : { color: cfg.text }
              }
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = cfg.hoverBg;
                  (e.currentTarget as HTMLElement).style.color = cfg.activeText;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = cfg.text;
                }
              }}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div
        style={{ borderTop: `1px solid ${cfg.border}` }}
        className="px-4 py-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              backgroundColor: cfg.isLight ? "#e2e8f0" : activeSwatch,
              color: cfg.isLight ? "#334155" : "#ffffff",
            }}
          >
            {currentUser?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: cfg.logoText }}>
              {currentUser?.name ?? (isAdmin ? "Admin" : "Cashier")}
            </p>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-0.5"
              style={{
                backgroundColor: isAdmin ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                color: isAdmin ? "#ef4444" : "#22c55e",
              }}
            >
              {isAdmin ? "Admin" : "Cashier"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg transition-colors"
            style={{ color: cfg.muted }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = cfg.isLight ? "#ef4444" : "#ffffff";
              (e.currentTarget as HTMLElement).style.backgroundColor = cfg.isLight ? "#fee2e2" : "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = cfg.muted;
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
