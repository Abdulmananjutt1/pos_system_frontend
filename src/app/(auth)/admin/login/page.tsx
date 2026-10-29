"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Pill, BarChart3, Users, Package } from "lucide-react";
import { authService } from "@/services/authService";
import { toastSuccess, toastApiError } from "@/lib/toast";
import Link from "next/link";

const FEATURES = [
  { icon: Pill,      title: "Inventory Control",   desc: "Real-time stock tracking with expiry alerts" },
  { icon: BarChart3, title: "Sales Analytics",      desc: "Daily, weekly & monthly revenue insights" },
  { icon: Users,     title: "Customer Management",  desc: "Loyalty programs & purchase history" },
  { icon: Package,   title: "Purchase Orders",      desc: "Streamlined supplier order management" },
];

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const emailVal = email.includes("@") ? email : `${email}@pharmapos.com`;
      const { token, user } = await authService.login(emailVal, password);

      // Only admin can use this portal
      if (user.role !== "admin") {
        setError("Access denied. This portal is for Admins only. Use the Cashier login.");
        return;
      }

      authService.saveToken(token, user.role);
      toastSuccess(`Welcome, ${user.name}!`);
      router.push("/"); // Admin goes to dashboard
    } catch (err) {
      toastApiError(err);
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Branding */}
      <div className="hidden lg:flex w-[52%] flex-col relative overflow-hidden bg-[#1e3a5f]">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <Pill size={22} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl leading-none">PharmaPOS</span>
              <span className="block text-blue-200/70 text-[11px] font-medium tracking-widest uppercase mt-0.5">Admin Suite</span>
            </div>
          </div>

          <div className="my-12">
            <span className="inline-flex items-center gap-1.5 bg-blue-400/20 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ring-blue-300/20 mb-5">
              <ShieldCheck size={12} /> Super Admin Portal
            </span>
            <h1 className="text-[2.6rem] font-extrabold leading-[1.15] text-white mb-4">
              Manage your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                pharmacy smarter
              </span>
            </h1>
            <p className="text-blue-100/60 text-base leading-relaxed max-w-sm">
              Full access to inventory, reports, settings, and staff management.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-auto">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/[0.07] hover:bg-white/[0.11] transition-colors rounded-2xl p-4 ring-1 ring-white/10">
                <div className="w-8 h-8 rounded-xl bg-blue-400/20 flex items-center justify-center mb-3">
                  <Icon size={15} className="text-cyan-300" />
                </div>
                <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                <p className="text-blue-200/50 text-xs mt-1 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-blue-300/30 text-xs mt-8">© 2026 PharmaPOS · All rights reserved</p>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 lg:p-16">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Pill size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">PharmaPOS</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 mb-3">
              <ShieldCheck size={12} />Admin Portal
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sign in as Admin</h2>
            <p className="text-slate-500 text-sm mt-1.5">Access the full management dashboard.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-7">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Admin Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin" autoFocus
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <ShieldCheck size={15} />}
                {loading ? "Signing in…" : "Sign In as Admin"}
              </button>
            </form>

            {/* Demo creds */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs">demo credentials</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                <p className="font-mono text-sm font-bold text-slate-700">admin</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</p>
                <p className="font-mono text-sm font-bold text-slate-700">admin123</p>
              </div>
            </div>
          </div>

          {/* Cashier link */}
          <p className="text-center mt-5 text-sm text-slate-500">
            Are you a cashier?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              Cashier Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
