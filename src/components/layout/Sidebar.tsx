"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Pill,
  Users,
  Truck,
  BarChart2,
  Settings,
  Cross,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",     href: "/",          icon: LayoutDashboard },
  { label: "Point of Sale", href: "/sales",      icon: ShoppingCart    },
  { label: "Inventory",     href: "/inventory",  icon: Package         },
  { label: "Medicines",     href: "/medicines",  icon: Pill            },
  { label: "Customers",     href: "/customers",  icon: Users           },
  { label: "Suppliers",     href: "/suppliers",  icon: Truck           },
  { label: "Reports",       href: "/reports",    icon: BarChart2       },
  { label: "Settings",      href: "/settings",   icon: Settings        },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="theme-sidebar w-64 h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden">

      {/* ── Logo ── */}
      <div className="px-6 py-5 border-b theme-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 theme-logo-icon rounded-xl flex items-center justify-center shrink-0">
            <Cross size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">PharmaPOS</p>
            <p className="text-xs theme-sidebar-muted">Pharmacy System</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                isActive
                  ? "theme-sidebar-active"
                  : "theme-sidebar-nav-item"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 py-4 border-t theme-sidebar-border">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: "var(--sidebar-active-bg)" }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs theme-sidebar-muted">Cashier</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
