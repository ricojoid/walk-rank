"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Footprints,
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Flame,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [dailyGoal, setDailyGoal] = useState("8000");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name, email, password, dailyGoal: parseInt(dailyGoal) || 8000 }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickDemo = async (demoEmail: string, roleName: string) => {
    setError("");
    setDemoLoading(demoEmail);

    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk demo");
      }

      if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan demo login.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#0B0F17] relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Background subtle glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 p-2.5 shadow-lg shadow-red-600/20 mb-3">
            <Footprints className="w-6 h-6 text-white font-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Walk<span className="text-red-500">Rank</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Corporate Step Tracker & Analytics Dashboard
          </p>
        </div>

        {/* 1-Click Quick Demo Login Card */}
        <div className="mb-6 p-4 rounded-2xl bg-[#121826] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Login
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ready to Test</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Super Admin Button */}
            <button
              type="button"
              onClick={() => handle1ClickDemo("admin@walkrank.com", "Super Admin")}
              disabled={!!demoLoading}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 text-left flex items-center justify-between group transition-all cursor-pointer hover:border-red-500/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    Super Admin
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      ADMIN
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Executive overview, date range filters & weighted leaderboard
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Regular User 1 (Budi) */}
            <button
              type="button"
              onClick={() => handle1ClickDemo("budi@walkrank.com", "Budi Santoso")}
              disabled={!!demoLoading}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 text-left flex items-center justify-between group transition-all cursor-pointer hover:border-slate-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    Budi Santoso
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      USER
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Daily step logging, goal progress & personal stats
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Regular User 2 (Siti) */}
            <button
              type="button"
              onClick={() => handle1ClickDemo("siti@walkrank.com", "Siti Rahma")}
              disabled={!!demoLoading}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-700/80 text-left flex items-center justify-between group transition-all cursor-pointer hover:border-slate-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    Siti Rahma
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      USER
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Daily goal progress & consistency scoring
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Main Auth Form Box */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#121826] border border-slate-800 shadow-2xl relative">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-900/80 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Pratama"
                      required
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Daily Step Goal
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    placeholder="8000"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@walkrank.com"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Processing..."
                : isRegister
                ? "Create Account"
                : "Sign In to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
