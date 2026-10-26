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
import toast from "react-hot-toast";

const navItems = [
  { label: "Dashboard",       href: "/",                icon: LayoutDashboard  },
  { label: "Point of Sale",   href: "/sales",           icon: ShoppingCart     },
  { label: "Inventory",       href: "/inventory",       icon: Package          },
  { label: "Medicines",       href: "/medicines",       icon: Pill             },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList    },
  { label: "Customers",       href: "/customers",       icon: Users            },
  { label: "Suppliers",       href: "/suppliers",       icon: Truck            },
  { label: "Stock Count",     href: "/stock-count",     icon: ClipboardCheck   },
  { label: "Transfers",       href: "/transfers",       icon: ArrowLeftRight   },
  { label: "Returns",         href: "/returns",         icon: RotateCcw        },
  { label: "Reports",         href: "/reports",         icon: BarChart2        },
  { label: "Login History",   href: "/login-history",   icon: Clock            },
  { label: "Settings",        href: "/settings",        icon: Settings         },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = usePharmacyStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
  };

  return (
    <aside className="theme-sidebar w-56 h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-4 py-4 border-b theme-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 theme-logo-icon rounded-xl flex items-center justify-center shrink-0">
            <Cross size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight text-sm">PharmaPOS</p>
            <p className="text-xs theme-sidebar-muted">{currentUser?.branch ?? "Pharmacy System"}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium",
                isActive
                  ? "theme-sidebar-active"
                  : "theme-sidebar-nav-item"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 py-3 border-t theme-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "var(--sidebar-active-bg)" }}
          >
            {currentUser?.name?.[0] ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{currentUser?.name ?? "Admin"}</p>
            <p className="text-[10px] theme-sidebar-muted truncate">{currentUser?.role ?? "Admin"}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
