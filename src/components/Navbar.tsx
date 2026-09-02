"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Footprints,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  UserCheck,
  ChevronDown,
  Sparkles,
  Flame,
  Award,
  Users,
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "SUPER_ADMIN";
    department?: string | null;
    avatarUrl?: string | null;
    dailyGoal: number;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    setSwitching(true);
    setDropdownOpen(false);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href={isSuperAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Footprints className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-red-400 transition-colors">
                  Walk<span className="text-red-500">Rank</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Step Tracker
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isSuperAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    pathname === "/admin"
                      ? "bg-red-500/15 text-red-400 border border-red-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  Admin Analytics
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    pathname === "/dashboard"
                      ? "bg-red-500/15 text-red-400 border border-red-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  User Dashboard View
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    pathname === "/dashboard"
                      ? "bg-red-500/15 text-red-400 border border-red-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-red-400" />
                  My Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={switching}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Quick Demo Account Switcher"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Demo Switcher</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Demo Account
                  </div>
                  <div className="space-y-1 mt-1.5">
                    <button
                      onClick={() => handleQuickSwitch("admin@walkrank.com")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-red-950/30 hover:text-red-300 transition-colors ${
                        user.email === "admin@walkrank.com"
                          ? "bg-red-900/30 text-red-300 font-bold border border-red-500/30"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <div>
                          <p className="font-semibold">Super Admin</p>
                          <p className="text-[10px] text-slate-400">admin@walkrank.com</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                        ADMIN
                      </span>
                    </button>

                    <button
                      onClick={() => handleQuickSwitch("budi@walkrank.com")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors ${
                        user.email === "budi@walkrank.com"
                          ? "bg-emerald-900/30 text-emerald-300 font-bold border border-emerald-500/30"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div>
                          <p className="font-semibold">Budi Santoso</p>
                          <p className="text-[10px] text-slate-400">budi@walkrank.com</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        USER
                      </span>
                    </button>

                    <button
                      onClick={() => handleQuickSwitch("siti@walkrank.com")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors ${
                        user.email === "siti@walkrank.com"
                          ? "bg-emerald-900/30 text-emerald-300 font-bold border border-emerald-500/30"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        <div>
                          <p className="font-semibold">Siti Rahma</p>
                          <p className="text-[10px] text-slate-400">siti@walkrank.com</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        USER
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-slate-300">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B0F17] ${
                    isSuperAdmin ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
              </div>

              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-100 max-w-[120px] truncate">
                    {user.name}
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      isSuperAdmin
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isSuperAdmin ? "SUPER ADMIN" : "USER"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
