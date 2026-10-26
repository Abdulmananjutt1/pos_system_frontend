"use client";

import { useState } from "react";
import { Clock, LogIn, LogOut, Key, Search, AlertCircle, Users } from "lucide-react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { usePharmacyStore } from "@/store";
import { LoginHistoryEntry, UserRole } from "@/types";

const ACTION_VARIANT: Record<LoginHistoryEntry["action"], "success" | "danger" | "warning" | "info" | "default"> = {
  Login: "success",
  Logout: "default",
  "PIN Switch": "info",
  "Session Timeout": "warning",
  "Force Logout": "danger",
};

const ACTION_ICON: Record<LoginHistoryEntry["action"], React.ElementType> = {
  Login: LogIn,
  Logout: LogOut,
  "PIN Switch": Key,
  "Session Timeout": Clock,
  "Force Logout": AlertCircle,
};

export default function LoginHistoryPage() {
  const { loginHistory, users } = usePharmacyStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [actionFilter, setActionFilter] = useState<LoginHistoryEntry["action"] | "All">("All");

  const filtered = loginHistory.filter((entry) => {
    const q = search.toLowerCase();
    const matchSearch = entry.username.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || entry.role === roleFilter;
    const matchAction = actionFilter === "All" || entry.action === actionFilter;
    return matchSearch && matchRole && matchAction;
  });

  const stats = {
    totalLogins: loginHistory.filter((e) => e.action === "Login").length,
    pinSwitches: loginHistory.filter((e) => e.action === "PIN Switch").length,
    uniqueUsers: new Set(loginHistory.map((e) => e.userId)).size,
  };

  const roles: (UserRole | "All")[] = ["All", "Admin", "Manager", "Cashier", "Pharmacist"];
  const actions: (LoginHistoryEntry["action"] | "All")[] = ["All", "Login", "Logout", "PIN Switch", "Session Timeout", "Force Logout"];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
      + " " + d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <Header title="Login History" />
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Logins" value={stats.totalLogins} subtitle="all time" icon={LogIn} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="PIN Switches" value={stats.pinSwitches} subtitle="cashier switches" icon={Key} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Unique Users" value={stats.uniqueUsers} subtitle="active accounts" icon={Users} iconColor="text-purple-600" iconBg="bg-purple-50" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or name…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {roles.map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${roleFilter === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {actions.map((a) => (
              <button key={a} onClick={() => setActionFilter(a)}
                className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${actionFilter === a ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Time", "User", "Role", "Action", "IP Address"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-14 text-center text-gray-400">
                  <Clock size={32} className="mx-auto mb-2 text-gray-300" strokeWidth={1.5} />
                  {loginHistory.length === 0 ? "No login history yet" : "No entries match the filter"}
                </td></tr>
              ) : filtered.map((entry) => {
                const Icon = ACTION_ICON[entry.action];
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatTime(entry.time)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-800">{entry.name}</p>
                        <p className="text-xs text-gray-400">@{entry.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{entry.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-gray-400 shrink-0" />
                        <Badge variant={ACTION_VARIANT[entry.action]}>{entry.action}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{entry.ipAddress ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} of {loginHistory.length} entries
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
