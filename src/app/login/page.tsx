"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Footprints,
  User,
  Lock,
  Mail,
  AlertCircle,
  Flame,
  Trophy,
  Zap,
  Activity,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AtSign,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { name, username, email, password }
        : { identifier: loginIdentifier, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Response is HTML or plain text (e.g. 502 Bad Gateway, 504 Timeout, 404 Not Found from Nginx/Proxy)
        const errorText = await res.text();
        const statusSnippet = res.status ? `(Status ${res.status} ${res.statusText || ""})` : "";
        throw new Error(
          `Server merespons dengan format tidak valid ${statusSnippet}. Kemungkinan container backend mati atau proxy Nginx 502 Bad Gateway.`
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || "Autentikasi gagal. Silakan coba lagi.");
      }

      const targetUrl = data.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#0B0F17] relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* 1. Dynamic Animated Ambient Background Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/20 rounded-full blur-[130px] pointer-events-none animate-orb-1" />
      <div className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none animate-orb-2" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-orb-3" />

      {/* 2. Geometric Dot Grid Matrix Overlay */}
      <div className="absolute inset-0 bg-grid-pattern bg-radial-gradient-mask opacity-60 pointer-events-none" />

      {/* 3. Floating Live Metric Badges (Desktop & Tablet) */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none max-w-6xl mx-auto">
        {/* Top-Left: Streak Champion */}
        <div className="absolute top-28 left-8 animate-float">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#121826]/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">7-Day Consistency</p>
              <p className="text-[9px] text-amber-400 font-semibold">8,000+ steps/day target</p>
            </div>
          </div>
        </div>

        {/* Top-Right: FID Leaderboard Rank */}
        <div className="absolute top-24 right-8 animate-float-reverse">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#121826]/90 border border-amber-500/30 shadow-2xl backdrop-blur-md">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">FID Champion</p>
              <p className="text-[9px] text-emerald-400 font-semibold">Rank #1 • 98.4 Score</p>
            </div>
          </div>
        </div>

        {/* Bottom-Left: 70/30 Scoring Engine */}
        <div className="absolute bottom-28 left-12 animate-float-slow">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#121826]/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <div className="p-1.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">70/30 Scoring Engine</p>
              <p className="text-[9px] text-slate-400 font-medium">70% Steps + 30% Consistency</p>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Live Step Synced */}
        <div className="absolute bottom-24 right-12 animate-float">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#121826]/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">Live Step Tracking</p>
              <p className="text-[9px] text-emerald-400 font-semibold">Auto-calculated distances</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Central Auth Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-rose-500 p-3 shadow-xl shadow-red-600/30 mb-3 border border-red-400/30 group hover:scale-105 transition-transform">
            <Footprints className="w-7 h-7 text-white font-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Walk<span className="text-red-500">Rank</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            FID Corporate Step Tracker & Leaderboard
          </p>
        </div>

        {/* Main Auth Form Card with Subtle Glowing Ring */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#121826]/95 border border-slate-800/90 shadow-2xl relative backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
          {/* Top Subtle Red Accent Line */}
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          {/* Segmented Auth Switcher */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegister
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
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
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isRegister
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {isRegister ? (
              <>
                {/* 1. Full Name */}
                <div className="animate-in fade-in duration-150">
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
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>

                {/* 2. Username */}
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                      }
                      placeholder="e.g. alex.pratama"
                      required
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used for signing in and on the leaderboard
                  </p>
                </div>

                {/* 3. Email Address */}
                <div className="animate-in fade-in duration-150">
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
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Sign In: Username or Email */
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username or Email Address
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="username or name@walkrank.com"
                    required
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                </div>
              </div>
            )}

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
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/25 transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>
                {loading
                  ? "Processing..."
                  : isRegister
                  ? "Create Account"
                  : "Sign In to Dashboard"}
              </span>
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure Authentication & Step Verification</span>
          </div>
        </div>
      </div>
    </main>
  );
}
