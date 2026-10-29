"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Pill, ShieldCheck } from "lucide-react";
import { authService } from "@/services/authService";
import { toastSuccess, toastApiError } from "@/lib/toast";
import Link from "next/link";

export default function CashierLoginPage() {
  const router = useRouter();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const emailVal = email.includes("@") ? email : `${email}@pharmapos.com`;
      const { token, user } = await authService.login(emailVal, password);

      // Admin should use admin login page
      if (user.role === "admin") {
        setError("Please use the Admin login portal.");
        return;
      }

      authService.saveToken(token, user.role);
      toastSuccess(`Welcome, ${user.name}!`);
      router.push("/sales"); // Cashier goes directly to POS
    } catch (err) {
      toastApiError(err);
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-white/30">
            <Pill size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PharmaPOS</h1>
          <p className="text-blue-200 text-sm mt-1">Cashier Login</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700 flex items-center gap-2">
              <span className="shrink-0">⚠️</span>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="cashier" autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 mt-2">
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Signing in…" : "Sign In to POS"}
            </button>
          </form>

          {/* Demo creds */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-2">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                <p className="font-mono text-xs font-bold text-gray-700">cashier</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Password</p>
                <p className="font-mono text-xs font-bold text-gray-700">cashier123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin link */}
        <p className="text-center mt-5">
          <Link href="/admin/login"
            className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-xs transition-colors">
            <ShieldCheck size={12} />Admin / Manager login
          </Link>
        </p>
      </div>
    </div>
  );
}
